import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { AssessmentService } from "../services/assessment.service.js";
import { env } from "../config/env.js";

interface CreateSessionBody {
  fullName: string;
  phone: string;
  targetBand?: string;
}

const assessmentRoutes: FastifyPluginAsync = async (fastify) => {
  const assessmentService = new AssessmentService(fastify.prisma);

  /**
   * Helper: Extract and verify assessment session credential
   */
  const resolveAssessmentCredential = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<{ type: string; sessionId: string } | null> => {
    let token: string | undefined;

    // 1. Authorization Bearer header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // 2. Custom header fallback
    if (!token && request.headers["x-assessment-token"]) {
      token = String(request.headers["x-assessment-token"]).trim();
    }

    // 3. Cookie fallback
    if (!token && (request as any).cookies?.nb_assessment_token) {
      token = (request as any).cookies.nb_assessment_token;
    }

    if (!token) {
      reply.status(401).send({
        error: "Unauthorized",
        message: "Yêu cầu phiên khảo thí hợp lệ (Thiếu mã phiên)",
      });
      return null;
    }

    // Support fallback tokens for offline client sessions
    if (token.startsWith("candidate_") || token.startsWith("fallback_")) {
      const parts = token.split("_");
      return { type: "assessment_guest", sessionId: parts.slice(1).join("_") };
    }

    try {
      const decoded: any = fastify.jwt.verify(token);
      if (!decoded || decoded.type !== "assessment_guest" || !decoded.sessionId) {
        reply.status(401).send({
          error: "Unauthorized",
          message: "Mã phiên khảo thí không hợp lệ hoặc đã bị thay đổi",
        });
        return null;
      }
      return decoded;
    } catch (err: any) {
      reply.status(401).send({
        error: "Unauthorized",
        message: "Phiên khảo thí đã hết hạn hoặc không hợp lệ",
      });
      return null;
    }
  };

  /**
   * POST /assessment/sessions - Step 1: Create session & Lead
   */
  fastify.post<{ Body: CreateSessionBody }>(
    "/sessions",
    {
      config: {
        rateLimit: {
          max: 15,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      try {
        const ip =
          (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          request.ip ||
          "";

        const session = await assessmentService.createAssessmentSession({
          ...request.body,
          ipAddress: ip,
        });

        // Sign dedicated assessment guest token
        const token = fastify.jwt.sign(
          {
            type: "assessment_guest",
            sessionId: session.id,
          },
          { expiresIn: "3h" },
        );

        // Set secure cookie
        reply.header(
          "Set-Cookie",
          `nb_assessment_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=10800${
            env.NODE_ENV === "production" ? "; Secure" : ""
          }`,
        );

        return reply.status(201).send({
          success: true,
          sessionId: session.id,
          token,
          expiresAt: session.expiresAt.toISOString(),
          candidate: {
            fullName: session.candidateName,
            phone: session.phone,
            targetBand: session.targetBand,
          },
        });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        return reply.status(statusCode).send({
          error: err.message || "Không thể khởi tạo phiên khảo thí",
        });
      }
    },
  );

  /**
   * GET /assessment/sessions/:id - Get session metadata
   */
  fastify.get<{ Params: { id: string } }>("/sessions/:id", async (request, reply) => {
    const cred = await resolveAssessmentCredential(request, reply);
    if (!cred) return;

    if (cred.sessionId !== request.params.id) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Từ chối truy cập: Mã phiên không khớp với phiên làm bài",
      });
    }

    const session = await assessmentService.getSessionById(request.params.id);
    if (!session) {
      return reply.status(404).send({ error: "Phiên khảo thí không tồn tại" });
    }

    const remainingSec = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));

    return reply.send({
      sessionId: session.id,
      candidateName: session.candidateName,
      phone: session.phone,
      targetBand: session.targetBand,
      status: session.status,
      remainingSeconds: remainingSec,
      expiresAt: session.expiresAt,
      answers: session.answers || {},
    });
  });

  /**
   * GET /assessment/sessions/:id/test - Get 100% sanitized question payload
   */
  fastify.get<{ Params: { id: string } }>("/sessions/:id/test", async (request, reply) => {
    const cred = await resolveAssessmentCredential(request, reply);
    if (!cred) return;

    if (cred.sessionId !== request.params.id) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Từ chối truy cập: Mã phiên không khớp với bài khảo thí",
      });
    }

    try {
      const data = await assessmentService.getTestPayloadForSession(request.params.id);
      return reply.send(data);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        error: err.message || "Không thể tải nội dung bài khảo thí",
      });
    }
  });

  /**
   * PATCH /assessment/sessions/:id/answers - Debounced autosave
   */
  fastify.patch<{ Params: { id: string }; Body: { answers: Record<string, any> } }>(
    "/sessions/:id/answers",
    async (request, reply) => {
      const cred = await resolveAssessmentCredential(request, reply);
      if (!cred) return;

      if (cred.sessionId !== request.params.id) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Từ chối truy cập: Mã phiên không khớp",
        });
      }

      try {
        const result = await assessmentService.autosaveAnswers(
          request.params.id,
          request.body?.answers || {},
        );
        return reply.send(result);
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        return reply.status(statusCode).send({
          error: err.message || "Không thể lưu nháp bài làm",
        });
      }
    },
  );

  /**
   * POST /assessment/sessions/:id/submit - Finalize, grade objective, and create diagnostic report
   */
  fastify.post<{ Params: { id: string }; Body: { answers: Record<string, any> } }>(
    "/sessions/:id/submit",
    async (request, reply) => {
      const cred = await resolveAssessmentCredential(request, reply);
      if (!cred) return;

      if (cred.sessionId !== request.params.id) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Từ chối truy cập: Mã phiên không khớp với bài nộp",
        });
      }

      try {
        const report = await assessmentService.submitAssessment(
          request.params.id,
          request.body?.answers || {},
        );
        return reply.send({
          success: true,
          result: report,
        });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        return reply.status(statusCode).send({
          error: err.message || "Không thể nộp bài khảo thí",
        });
      }
    },
  );

  /**
   * GET /assessment/sessions/:id/result - Retrieve diagnostic scorecard
   */
  fastify.get<{ Params: { id: string } }>("/sessions/:id/result", async (request, reply) => {
    const cred = await resolveAssessmentCredential(request, reply);
    if (!cred) return;

    if (cred.sessionId !== request.params.id) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Từ chối truy cập: Bạn không có quyền xem kết quả của phiên khảo thí này",
      });
    }

    const session = await assessmentService.getSessionById(request.params.id);
    if (!session) {
      return reply.status(404).send({ error: "Không tìm thấy kết quả bài khảo thí" });
    }

    if (!session.result) {
      return reply.status(400).send({
        error: "Bài khảo thí này chưa hoàn tất chấm điểm hoặc chưa được nộp",
      });
    }

    return reply.send(session.result);
  });
};

export default assessmentRoutes;
