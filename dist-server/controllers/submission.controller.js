import { ExamSubmissionService } from "../services/exam-submission.service.js";
import { handleValidation } from "../utils/validation.js";
import { paginationSchema } from "../schemas/common.schema.js";
export class SubmissionController {
    service;
    constructor(fastify) {
        this.service = new ExamSubmissionService(fastify.prisma);
    }
    async list(request, reply) {
        const dataQuery = handleValidation(paginationSchema.safeParse(request.query), request, reply);
        if (!dataQuery)
            return;
        try {
            const user = request.user;
            const result = await this.service.listSubmissions(user, {
                ...dataQuery,
                ...request.query,
            });
            return reply.send(result);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async getById(request, reply) {
        try {
            const user = request.user;
            const submission = await this.service.getSubmissionById(user, request.params.id);
            return reply.send(submission);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async start(request, reply) {
        try {
            const user = request.user;
            const { examId } = request.body || {};
            if (!examId) {
                return reply.status(400).send({ error: "examId là bắt buộc" });
            }
            const { submission, isNew } = await this.service.startAttempt(user, examId);
            return reply.status(isNew ? 201 : 200).send(submission);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async saveDraft(request, reply) {
        try {
            const user = request.user;
            const { answers, version } = request.body || {};
            const result = await this.service.saveDraft(user, request.params.id, answers || [], version);
            return reply.send(result);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async submit(request, reply) {
        try {
            const user = request.user;
            const payload = request.body || { answers: [] };
            const result = await this.service.submitExam(user, request.params.id, payload);
            return reply.send(result);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async startRevision(request, reply) {
        try {
            const user = request.user;
            const { examId, clonePreviousAnswers } = request.body || {};
            if (!examId) {
                return reply.status(400).send({ error: "examId là bắt buộc" });
            }
            const { submission, isNew } = await this.service.startRevision(user, examId, { clonePreviousAnswers });
            return reply.status(isNew ? 201 : 200).send(submission);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async grade(request, reply) {
        try {
            const user = request.user;
            const { grades = [], totalScore, feedback, primaryErrorCategory, revisionRequired, criteriaScores } = request.body || {};
            const result = await this.service.gradeManualSubmission(user, request.params.id, grades, totalScore, {
                feedback,
                primaryErrorCategory,
                revisionRequired,
                criteriaScores,
            });
            return reply.send(result);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
    async regrade(request, reply) {
        try {
            const user = request.user;
            const result = await this.service.regradeSubmission(user, request.params.id, request.body || { reason: "" });
            return reply.send(result);
        }
        catch (err) {
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: err.message });
        }
    }
}
