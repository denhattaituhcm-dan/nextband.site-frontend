import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { AssessmentService } from "../services/assessment.service.js";
import { env } from "../config/env.js";

interface AssessmentSessionBody {
  fullName: string;
  phone: string;
  targetBand?: string;
  assessmentCode?: string;
  examId?: string;
}

const assessmentRoutes: FastifyPluginAsync = async (fastify) => {
  const assessmentService = new AssessmentService(fastify.prisma);

  /**
   * Helper: Extract and verify assessment session credential
   */
  const resolveAssessmentCredential = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<{ type: string; sessionId: string; examId: string } | null> => {
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
        message: "Yêu cầu phiên khảo thí hợp lệ (Thiếu token khảo thí)",
      });
      return null;
    }

    try {
      const decoded: any = fastify.jwt.verify(token);
      if (!decoded || decoded.type !== "assessment_guest" || !decoded.sessionId) {
        reply.status(401).send({
          error: "Unauthorized",
          message: "Token khảo thí không hợp lệ hoặc đã bị sửa đổi",
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
   * POST /assessment/sessions - Create new guest assessment session
   */
  fastify.post<{ Body: AssessmentSessionBody }>(
    "/sessions",
    {
      config: {
        rateLimit: {
          max: 10,
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

        const { session, exam } = await assessmentService.createAssessmentSession({
          ...request.body,
          ipAddress: ip,
        });

        // Sign dedicated assessment guest token
        const token = fastify.jwt.sign(
          {
            type: "assessment_guest",
            sessionId: session.id,
            examId: session.examId,
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
          examId: session.examId,
          examTitle: exam.title,
          durationMinutes: exam.durationMinutes || 45,
          token,
          expiresAt: session.expiresAt,
          candidate: {
            fullName: session.fullName,
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
   * GET /assessment/exams/:id - Load clean exam for active assessment session
   */
  fastify.get<{ Params: { id: string } }>("/exams/:id", async (request, reply) => {
    const cred = await resolveAssessmentCredential(request, reply);
    if (!cred) return;

    try {
      const examData = await assessmentService.getExamForSession(
        cred.sessionId,
        request.params.id,
      );
      return reply.send(examData);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        error: err.message || "Không thể tải đề thi khảo thí",
      });
    }
  });

  /**
   * PUT /assessment/sessions/:id/autosave - Autosave answers during exam
   */
  fastify.put<{ Params: { id: string }; Body: { answers: any } }>(
    "/sessions/:id/autosave",
    async (request, reply) => {
      const cred = await resolveAssessmentCredential(request, reply);
      if (!cred) return;

      if (cred.sessionId !== request.params.id) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Từ chối truy cập: Token không khớp với phiên làm bài",
        });
      }

      try {
        const result = await assessmentService.autosaveAnswers(
          request.params.id,
          request.body?.answers,
        );
        return reply.send(result);
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        return reply.status(statusCode).send({
          error: err.message || "Không thể lưu bài làm",
        });
      }
    },
  );

  /**
   * POST /assessment/sessions/:id/submit - Finalize and grade assessment test
   */
  fastify.post<{ Params: { id: string }; Body: { answers: any } }>(
    "/sessions/:id/submit",
    async (request, reply) => {
      const cred = await resolveAssessmentCredential(request, reply);
      if (!cred) return;

      if (cred.sessionId !== request.params.id) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Từ chối truy cập: Token không khớp với phiên làm bài",
        });
      }

      try {
        const report = await assessmentService.submitAssessment(
          request.params.id,
          request.body?.answers,
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
   * GET /assessment/results/:id - Get diagnostic report
   */
  fastify.get<{ Params: { id: string } }>("/results/:id", async (request, reply) => {
    // Check candidate credential
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
        error: "Bài khảo thí này chưa được nộp hoặc chưa có kết quả",
      });
    }

    return reply.send(session.result);
  });
};

export default assessmentRoutes;
