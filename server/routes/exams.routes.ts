import { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { paginationSchema } from "../schemas/common.schema.js";
import { createExamSchema, updateExamSchema } from "../schemas/exam.schema.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { handleValidation } from "../utils/validation.js";
import { toFileUrl } from "../utils/file.js";
import { verifyPassword } from "../utils/password.js";
import { AuthorizationService } from "../services/authorization.service.js";

const examsRoutes: FastifyPluginAsync = async (fastify) => {
  const cleanQuestionData = (q: any, isAdminOrTeacher: boolean) => {
    // 1. Calculate safe metadata for UI rendering without leaking the answer strings
    let selectionMode: "single" | "multiple" = "single";
    let maxSelections = 1;

    if (q.questionType === "multiple_choice") {
      if (q.correctAnswer && typeof q.correctAnswer === "string") {
        const answers = q.correctAnswer.split("|").map((s: string) => s.trim()).filter(Boolean);
        if (answers.length > 1) {
          selectionMode = "multiple";
          maxSelections = answers.length;
        }
      }
    }

    if (isAdminOrTeacher) {
      return {
        ...q,
        selectionMode,
        maxSelections,
        isMultiChoice: selectionMode === "multiple",
      };
    }

    // 2. Student Safe DTO: Strip 100% of secret fields
    const cleaned = { ...q };
    if (q.questionType === "matching" && q.correctAnswer) {
      try {
        const config = JSON.parse(q.correctAnswer);
        delete config.pairs;
        if (!cleaned.options || typeof cleaned.options !== "object") {
          cleaned.options = { items: config.items || [], options: config.options || [] };
        }
      } catch {}
    }

    delete cleaned.correctAnswer;
    delete cleaned.correct_answer;
    delete cleaned.audioScript;
    delete cleaned.audio_script;
    delete cleaned.acceptedAnswers;
    delete cleaned.answerKey;
    delete cleaned.answer_key;

    cleaned.correctAnswer = null;
    cleaned.audioScript = null;
    cleaned.selectionMode = selectionMode;
    cleaned.maxSelections = maxSelections;
    cleaned.isMultiChoice = selectionMode === "multiple";

    return cleaned;
  };

  // GET /exams - List all exams
  fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
    const query = paginationSchema.safeParse(request.query);
    const { courseId, isPublished, isActive } = request.query as any;

    if (!query.success) {
      return reply.status(400).send({ error: "Tham số truy vấn không hợp lệ" });
    }

    const { page, limit, search, sortBy = "createdAt", sortOrder } = query.data;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Teacher: only see exams from courses they teach
    const user = request.user;
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");

    if (isTeacher && !isAdmin) {
      where.course = { teacherId: user.id };
    } else if (!isAdmin && !isTeacher) {
      // Student: see exams from enrolled courses OR open exams
      where.OR = [
        {
          course: {
            enrollments: { some: { studentId: user.id } },
          },
        },
        { isOpen: true },
      ];
      where.isPublished = true;
      where.isActive = true;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished === "true";
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.title = { contains: search };
    }

    const [data, total] = await Promise.all([
      fastify.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          course: {
            select: { id: true, title: true },
          },
          _count: {
            select: { sections: true, submissions: true },
          },
        },
      }),
      fastify.prisma.exam.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  });

  // GET /exams/:id - Get exam with sections
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;

      const exam = await fastify.prisma.exam.findUnique({
        where: { id },
        include: {
          course: { select: { id: true, title: true } },
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questionGroups: {
                orderBy: { orderIndex: "asc" },
                include: {
                  questions: { orderBy: { orderIndex: "asc" } },
                },
              },
            },
          },
        },
      });

      if (!exam) {
        return reply.status(404).send({ error: "Không tìm thấy bài thi" });
      }

      const user = request.user;
      const isAdmin = user.roles.includes("admin");
      const isTeacher = user.roles.includes("teacher");

      // IDOR Check
      if (!isAdmin && !isTeacher) {
        const authService = new AuthorizationService(fastify.prisma);
        const isAuthorized = await authService.isStudentAuthorizedForExam({
          studentId: user.id,
          examId: exam.id,
          courseId: exam.courseId,
          isOpen: exam.isOpen,
        });

        if (!isAuthorized) {
          return reply
            .status(403)
            .send({ error: "Bạn chưa đăng ký khóa học hoặc lớp học này để xem bài thi" });
        }

        if (!exam.isPublished || !exam.isActive) {
          return reply.status(403).send({ error: "bài tập hiện không còn khả dụng" });
        }
      }

      // Format lại liên kết file trong các section và question
      const shouldShowTranscript = isAdmin || isTeacher;
      const formattedSections = exam.sections.map((section) => ({
        ...section,
        audioUrl: toFileUrl(section.audioUrl),
        audioScript: shouldShowTranscript ? section.audioScript : undefined,
        questionGroups: section.questionGroups.map((group) => ({
          ...group,
          audioUrl: toFileUrl(group.audioUrl),
          questions: group.questions.map((question) => {
            const formatted = {
              ...question,
              audioUrl: toFileUrl(question.audioUrl),
            };
            return cleanQuestionData(formatted, isAdmin || isTeacher);
          }),
        })),
      }));

      return {
        ...exam,
        sections: formattedSections,
      };
    },
  );

  // POST /exams - Create exam
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const data = handleValidation(
        createExamSchema.safeParse(request.body),
        request,
        reply,
      );
      if (!data) return;
      const { isLocked: _ignoredIsLocked, ...safeData } = data as any;

      const exam = await fastify.prisma.exam.create({
        data: safeData,
      });

      // Auto-create 5 default sections
      const defaultSections = [
        {
          sectionType: "listening" as const,
          title: "Listening",
          orderIndex: 0,
        },
        { sectionType: "reading" as const, title: "Reading", orderIndex: 1 },
        { sectionType: "writing" as const, title: "Writing", orderIndex: 2 },
        { sectionType: "speaking" as const, title: "Speaking", orderIndex: 3 },
        { sectionType: "general" as const, title: "Grammar", orderIndex: 4 },
      ];

      await fastify.prisma.examSection.createMany({
        data: defaultSections.map((s) => ({
          examId: exam.id,
          ...s,
        })),
      });

      // Return exam with sections
      const examWithSections = await fastify.prisma.exam.findUnique({
        where: { id: exam.id },
        include: {
          sections: { orderBy: { orderIndex: "asc" } },
        },
      });

      return reply.status(201).send(examWithSections);
    },
  );

  // PUT /exams/:id - Update exam
  fastify.put<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateExamSchema.safeParse(request.body),
        request,
        reply,
      );
      if (!data) return;
      const { isLocked: _ignoredIsLocked, ...safeData } = data as any;

      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireExamAuthoringAccess(
          id,
          request.user.id,
          request.user.roles,
        );
      } catch (err: any) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }

      const existing = await fastify.prisma.exam.findUnique({
        where: { id },
        select: { id: true, isActive: true, isLocked: true },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Không tìm thấy bài thi" });
      }

      if (existing.isActive === false || existing.isLocked === true) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "Đề thi đã lưu trữ hoặc bị khóa, không thể cập nhật thông tin.",
        });
      }

      const updatedExam = await fastify.prisma.exam.update({
        where: { id },
        data: safeData,
      });

      return updatedExam;
    },
  );

  // DELETE /exams/:id (T1-B Historical Data Protection)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      const { password } = (request.body || {}) as { password?: string };

      const actor = await fastify.prisma.user.findFirst({
        where: { userId: request.user.id },
      });
      if (!actor) {
        return reply.status(401).send({ error: "Không thể xác thực người dùng" });
      }

      const existing = await fastify.prisma.exam.findUnique({
        where: { id },
        select: { id: true, isActive: true, isLocked: true },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Không tìm thấy bài thi" });
      }

      if (existing.isActive === false) {
        return reply.status(409).send({
          success: false,
          action: "already_archived",
          errorCode: "EXAM_ALREADY_ARCHIVED",
          message: "Đề thi này đã ở trong kho lưu trữ (Archived).",
        });
      }

      // T1-B: Transactional Historical Protection & Usage Guard
      const submissionCount = await fastify.prisma.examSubmission.count({
        where: { examId: id },
      });

      if (submissionCount > 0) {
        // Atomic Safe Archive Transaction
        await fastify.prisma.$transaction(async (tx) => {
          await tx.exam.update({
            where: { id },
            data: {
              isPublished: false,
              isActive: false,
              isOpen: false,
              isLocked: true,
            },
          });
        });

        return reply.status(409).send({
          success: false,
          action: "archived",
          errorCode: "CANNOT_HARD_DELETE_EXAM_WITH_SUBMISSIONS",
          message:
            "Đề thi đã có bài làm của học viên. Hệ thống đã tự động chuyển sang chế độ Lưu trữ (Archived) để bảo toàn 100% lịch sử.",
          submissionCount,
        });
      }

      await fastify.prisma.exam.delete({ where: { id } });
      return {
        success: true,
        action: "hard_deleted",
        message: "Đã xóa bài thi chưa sử dụng thành công",
      };
    },
  );
};

export default examsRoutes;
