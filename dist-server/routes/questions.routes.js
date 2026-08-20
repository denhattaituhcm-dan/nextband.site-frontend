import { z } from "zod";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { handleValidation } from "../utils/validation.js";
import { AuthorizationService } from "../services/authorization.service.js";
const questionTypeEnum = z.enum([
    "multiple_choice",
    "fill_blank",
    "matching",
    "essay",
    "speaking",
    "listening",
    "short_answer",
    "true_false_not_given",
    "yes_no_not_given",
], {
    errorMap: () => ({
        message: "Loại câu hỏi không hợp lệ",
    }),
});
const createQuestionGroupSchema = z.object({
    sectionId: z.string({ required_error: "ID phần thi là bắt buộc" }),
    title: z.string().optional(),
    instructions: z.string().optional(),
    passage: z.string().optional(),
    audioUrl: z.string().optional(),
    orderIndex: z.number().int().default(0),
});
import { sanitizeBackendQuestionPayload } from "../utils/questionNormalizer.js";
const validateQuestionSemantic = (data, ctx) => {
    const type = data.questionType;
    if (!type)
        return;
    if (type === "multiple_choice") {
        let opts = data.options;
        if (typeof opts === "string") {
            try {
                opts = JSON.parse(opts);
            }
            catch {
                opts = null;
            }
        }
        const validOptions = Array.isArray(opts)
            ? opts.filter((o) => typeof o === "string" && o.trim().length > 0)
            : [];
        if (validOptions.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn có nội dung",
                path: ["options"],
            });
        }
    }
    if (type === "matching" && data.correctAnswer) {
        try {
            const parsed = JSON.parse(data.correctAnswer);
            if (!parsed ||
                !Array.isArray(parsed.items) ||
                parsed.items.length === 0 ||
                !Array.isArray(parsed.options) ||
                parsed.options.length === 0 ||
                typeof parsed.pairs !== "object" ||
                parsed.pairs === null ||
                Object.keys(parsed.pairs).length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Dữ liệu nối đáp án (matching) không đúng cấu trúc (items, options, pairs)",
                    path: ["correctAnswer"],
                });
            }
        }
        catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Đáp án matching phải là chuỗi JSON hợp lệ",
                path: ["correctAnswer"],
            });
        }
    }
    if (type === "true_false_not_given" && data.correctAnswer) {
        const val = data.correctAnswer.trim().toUpperCase();
        if (!["TRUE", "FALSE", "NOT GIVEN"].includes(val)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Đáp án TRUE/FALSE/NOT GIVEN phải là TRUE, FALSE hoặc NOT GIVEN",
                path: ["correctAnswer"],
            });
        }
    }
    if (type === "yes_no_not_given" && data.correctAnswer) {
        const val = data.correctAnswer.trim().toUpperCase();
        if (!["YES", "NO", "NOT GIVEN"].includes(val)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Đáp án YES/NO/NOT GIVEN phải là YES, NO hoặc NOT GIVEN",
                path: ["correctAnswer"],
            });
        }
    }
};
const baseQuestionSchema = z.object({
    groupId: z.string({ required_error: "ID nhóm câu hỏi là bắt buộc" }),
    questionType: questionTypeEnum,
    questionText: z.string().min(1, "Nội dung câu hỏi là bắt buộc"),
    options: z.any().optional(),
    correctAnswer: z.string().optional(),
    audioUrl: z.string().optional(),
    points: z.number({ invalid_type_error: "Điểm phải là số" }).int().default(1),
    orderIndex: z.number().int().default(0),
});
const createQuestionSchema = baseQuestionSchema.superRefine(validateQuestionSemantic);
const updateQuestionGroupSchema = createQuestionGroupSchema.partial();
const updateQuestionSchema = baseQuestionSchema.partial().superRefine((data, ctx) => {
    if (data.questionType) {
        validateQuestionSemantic(data, ctx);
    }
});
const questionsRoutes = async (fastify) => {
    const MAX_AUTO_ORDER_RETRIES = 5;
    const isPrismaErrorCode = (error, code) => typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code;
    const createQuestionWithAutoOrder = async (data) => {
        let attempt = 0;
        let lastError;
        while (attempt < MAX_AUTO_ORDER_RETRIES) {
            try {
                return await fastify.prisma.$transaction(async (tx) => {
                    const maxOrder = await tx.question.aggregate({
                        where: { groupId: data.groupId },
                        _max: { orderIndex: true },
                    });
                    const nextOrderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
                    return tx.question.create({
                        data: {
                            ...data,
                            orderIndex: nextOrderIndex,
                        },
                    });
                }, { isolationLevel: "Serializable" });
            }
            catch (error) {
                lastError = error;
                const shouldRetry = isPrismaErrorCode(error, "P2002") || isPrismaErrorCode(error, "P2034");
                if (!shouldRetry) {
                    throw error;
                }
                attempt += 1;
            }
        }
        throw lastError;
    };
    const hasOrderConflict = async (groupId, orderIndex, excludeId) => {
        const existing = await fastify.prisma.question.findFirst({
            where: {
                groupId,
                orderIndex,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
            select: { id: true },
        });
        return !!existing;
    };
    const isExamArchivedBySectionId = async (sectionId) => {
        const section = await fastify.prisma.examSection.findUnique({
            where: { id: sectionId },
            include: { exam: { select: { isActive: true, isLocked: true } } },
        });
        const exam = section?.exam;
        return Boolean(exam && (exam.isActive === false || exam.isLocked === true));
    };
    const isExamArchivedByGroupId = async (groupId) => {
        const group = await fastify.prisma.questionGroup.findUnique({
            where: { id: groupId },
            include: { section: { include: { exam: { select: { isActive: true, isLocked: true } } } } },
        });
        const exam = group?.section?.exam;
        return Boolean(exam && (exam.isActive === false || exam.isLocked === true));
    };
    const isExamArchivedByQuestionId = async (questionId) => {
        const question = await fastify.prisma.question.findUnique({
            where: { id: questionId },
            include: { group: { include: { section: { include: { exam: { select: { isActive: true, isLocked: true } } } } } } },
        });
        const exam = question?.group?.section?.exam;
        return Boolean(exam && (exam.isActive === false || exam.isLocked === true));
    };
    // ============ Question Groups ============
    // POST /questions/groups
    fastify.post("/groups", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const data = handleValidation(createQuestionGroupSchema.safeParse(request.body), request, reply);
        if (!data)
            return;
        const authService = new AuthorizationService(fastify.prisma);
        try {
            await authService.requireSectionAuthoringAccess(data.sectionId, request.user.id, request.user.roles);
        }
        catch (err) {
            if (err.statusCode) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
        if (await isExamArchivedBySectionId(data.sectionId)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể tạo nhóm câu hỏi mới.",
            });
        }
        const group = await fastify.prisma.questionGroup.create({
            data,
        });
        return reply.status(201).send(group);
    });
    // PUT /questions/groups/:id
    fastify.put("/groups/:id", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { id } = request.params;
        const data = handleValidation(updateQuestionGroupSchema.safeParse(request.body), request, reply);
        if (!data)
            return;
        const authService = new AuthorizationService(fastify.prisma);
        try {
            await authService.requireQuestionGroupAuthoringAccess(id, request.user.id, request.user.roles);
        }
        catch (err) {
            if (err.statusCode) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
        if (await isExamArchivedByGroupId(id)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể chỉnh sửa nhóm câu hỏi.",
            });
        }
        const group = await fastify.prisma.questionGroup.update({
            where: { id },
            data,
        });
        return group;
    });
    // DELETE /questions/groups/:id
    fastify.delete("/groups/:id", { preHandler: [authenticate, requireRoles("admin")] }, async (request, reply) => {
        const { id } = request.params;
        if (await isExamArchivedByGroupId(id)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể xóa nhóm câu hỏi.",
            });
        }
        await fastify.prisma.questionGroup.delete({ where: { id } });
        return { success: true };
    });
    // ============ Questions ============
    // POST /questions
    fastify.post("/", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const data = handleValidation(createQuestionSchema.safeParse(request.body), request, reply);
        if (!data)
            return;
        const authService = new AuthorizationService(fastify.prisma);
        try {
            await authService.requireQuestionGroupAuthoringAccess(data.groupId, request.user.id, request.user.roles);
        }
        catch (err) {
            if (err.statusCode) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
        if (await isExamArchivedByGroupId(data.groupId)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể thêm câu hỏi mới.",
            });
        }
        const body = request.body;
        const orderIndexProvided = body &&
            (Object.prototype.hasOwnProperty.call(body, "orderIndex") ||
                Object.prototype.hasOwnProperty.call(body, "order_index"));
        const sanitized = sanitizeBackendQuestionPayload(data);
        if (!orderIndexProvided) {
            try {
                const question = await createQuestionWithAutoOrder(sanitized);
                return reply.status(201).send(question);
            }
            catch (error) {
                if (isPrismaErrorCode(error, "P2002")) {
                    return reply.status(409).send({
                        error: "Thứ tự câu hỏi bị trùng trong cùng nhóm",
                    });
                }
                throw error;
            }
        }
        const desiredOrder = data.orderIndex;
        if (await hasOrderConflict(data.groupId, desiredOrder)) {
            try {
                const question = await createQuestionWithAutoOrder(sanitized);
                return reply.status(201).send(question);
            }
            catch (error) {
                if (isPrismaErrorCode(error, "P2002")) {
                    return reply.status(409).send({
                        error: "Thứ tự câu hỏi bị trùng trong cùng nhóm",
                    });
                }
                throw error;
            }
        }
        sanitized.orderIndex = desiredOrder;
        try {
            const question = await fastify.prisma.question.create({
                data: sanitized,
            });
            return reply.status(201).send(question);
        }
        catch (error) {
            if (isPrismaErrorCode(error, "P2002")) {
                const question = await createQuestionWithAutoOrder(sanitized);
                return reply.status(201).send(question);
            }
            throw error;
        }
    });
    // PUT /questions/:id
    fastify.put("/:id", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { id } = request.params;
        const data = handleValidation(updateQuestionSchema.safeParse(request.body), request, reply);
        if (!data)
            return;
        const authService = new AuthorizationService(fastify.prisma);
        try {
            await authService.requireQuestionAuthoringAccess(id, request.user.id, request.user.roles);
        }
        catch (err) {
            if (err.statusCode) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
        if (await isExamArchivedByQuestionId(id)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể chỉnh sửa câu hỏi.",
            });
        }
        const body = request.body;
        const orderIndexProvided = body &&
            (Object.prototype.hasOwnProperty.call(body, "orderIndex") ||
                Object.prototype.hasOwnProperty.call(body, "order_index"));
        if (!orderIndexProvided) {
            delete data.orderIndex;
        }
        const existing = await fastify.prisma.question.findUnique({
            where: { id },
            select: { id: true, groupId: true, orderIndex: true, questionType: true },
        });
        if (!existing) {
            return reply.status(404).send({ error: "Không tìm thấy câu hỏi" });
        }
        const nextGroupId = data.groupId ?? existing.groupId;
        const nextOrderIndex = data.orderIndex !== undefined && data.orderIndex !== null
            ? data.orderIndex
            : existing.orderIndex ?? 0;
        const groupChanged = nextGroupId !== existing.groupId;
        const orderChanged = nextOrderIndex !== (existing.orderIndex ?? 0);
        const shouldValidateOrderConflict = groupChanged || orderChanged;
        if (shouldValidateOrderConflict) {
            if (await hasOrderConflict(nextGroupId, nextOrderIndex, id)) {
                return reply.status(409).send({
                    error: "Thứ tự câu hỏi bị trùng trong cùng nhóm",
                });
            }
        }
        const merged = {
            ...existing,
            ...data,
            groupId: nextGroupId,
            orderIndex: nextOrderIndex,
        };
        const sanitized = sanitizeBackendQuestionPayload(merged);
        const question = await fastify.prisma.question.update({
            where: { id },
            data: {
                ...sanitized,
                options: sanitized.options ? sanitized.options : undefined,
            },
        });
        return question;
    });
    // DELETE /questions/:id
    fastify.delete("/:id", { preHandler: [authenticate, requireRoles("admin")] }, async (request, reply) => {
        const { id } = request.params;
        if (await isExamArchivedByQuestionId(id)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể xóa câu hỏi.",
            });
        }
        await fastify.prisma.question.delete({ where: { id } });
        return { success: true };
    });
    // POST /questions/bulk - Bulk create questions
    fastify.post("/bulk", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { questions, groupId } = request.body;
        if (!Array.isArray(questions) || !groupId) {
            return reply
                .status(400)
                .send({ error: "Yêu cầu mảng questions và groupId" });
        }
        const authService = new AuthorizationService(fastify.prisma);
        try {
            await authService.requireQuestionGroupAuthoringAccess(groupId, request.user.id, request.user.roles);
        }
        catch (err) {
            if (err.statusCode) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
        if (await isExamArchivedByGroupId(groupId)) {
            return reply.status(409).send({
                error: "EXAM_ARCHIVED_IMMUTABLE",
                message: "Đề thi đã lưu trữ hoặc bị khóa, không thể thêm câu hỏi hàng loạt.",
            });
        }
        // Semantic validation for each bulk question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText || !String(q.questionText).trim()) {
                return reply.status(400).send({
                    error: `Câu hỏi số ${i + 1} không có nội dung`,
                });
            }
            if (q.questionType === "multiple_choice") {
                let opts = q.options;
                if (typeof opts === "string") {
                    try {
                        opts = JSON.parse(opts);
                    }
                    catch {
                        opts = null;
                    }
                }
                const validOptions = Array.isArray(opts)
                    ? opts.filter((o) => typeof o === "string" && o.trim().length > 0)
                    : [];
                if (validOptions.length < 2) {
                    return reply.status(400).send({
                        error: `Câu hỏi số ${i + 1} (Trắc nghiệm) phải có ít nhất 2 lựa chọn có nội dung`,
                    });
                }
            }
        }
        let attempt = 0;
        let lastError;
        while (attempt < MAX_AUTO_ORDER_RETRIES) {
            try {
                const created = await fastify.prisma.$transaction(async (tx) => {
                    const existingOrders = await tx.question.findMany({
                        where: { groupId },
                        select: { orderIndex: true },
                    });
                    const usedOrders = new Set();
                    existingOrders.forEach((item) => {
                        if (typeof item.orderIndex === "number") {
                            usedOrders.add(item.orderIndex);
                        }
                    });
                    const maxExisting = usedOrders.size > 0 ? Math.max(...Array.from(usedOrders)) : -1;
                    let nextOrder = maxExisting + 1;
                    const batchOrders = new Set();
                    const payload = questions.map((q) => {
                        const rawOrder = q.orderIndex !== undefined && q.orderIndex !== null
                            ? q.orderIndex
                            : null;
                        const orderIndex = rawOrder !== null ? rawOrder : nextOrder++;
                        if (usedOrders.has(orderIndex) || batchOrders.has(orderIndex)) {
                            throw new Error("DUPLICATE_ORDER_INDEX");
                        }
                        batchOrders.add(orderIndex);
                        const sanitized = sanitizeBackendQuestionPayload({
                            ...q,
                            groupId,
                            orderIndex,
                        });
                        return {
                            ...sanitized,
                            options: sanitized.options ? sanitized.options : undefined,
                        };
                    });
                    const result = await tx.question.createMany({
                        data: payload,
                    });
                    return result.count;
                }, { isolationLevel: "Serializable" });
                return { created };
            }
            catch (error) {
                lastError = error;
                if (error?.message === "DUPLICATE_ORDER_INDEX" || isPrismaErrorCode(error, "P2002")) {
                    return reply.status(409).send({
                        error: "Thứ tự câu hỏi bị trùng trong cùng nhóm",
                    });
                }
                if (isPrismaErrorCode(error, "P2034")) {
                    attempt += 1;
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    });
};
export default questionsRoutes;
