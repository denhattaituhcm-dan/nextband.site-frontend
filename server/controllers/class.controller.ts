import { FastifyRequest, FastifyReply } from "fastify";
import { ClassService } from "../services/class.service.js";
import { handleValidation } from "../utils/validation.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { createClassSchema, updateClassSchema } from "../schemas/class.schema.js";

export class ClassController {
  private service: ClassService;

  constructor(fastify: any) {
    this.service = new ClassService(fastify.prisma);
  }

  async getMyClasses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const result = await this.service.getMyClasses(user.id);
      return reply.send({ data: result });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const dataQuery = handleValidation(
      paginationSchema.safeParse(request.query),
      request,
      reply
    );
    if (!dataQuery) return;

    try {
      const user = (request as any).user;
      const result = await this.service.listClasses(user, {
        ...dataQuery,
        ...(request.query as any),
      });
      return reply.send(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const classData = await this.service.getClassById(user, request.params.id);
      return reply.send(classData);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createClassSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Dữ liệu không hợp lệ",
        details: parsed.error.flatten(),
      });
    }

    try {
      const user = (request as any).user;
      const result = await this.service.createClass(user, parsed.data);
      return reply.status(201).send(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateClassSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Dữ liệu không hợp lệ",
        details: parsed.error.flatten(),
      });
    }

    try {
      const user = (request as any).user;
      const result = await this.service.updateClass(user, request.params.id, parsed.data);
      return reply.send(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async addStudent(request: FastifyRequest<{ Params: { id: string }; Body: { studentId: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { studentId } = request.body || {};
      if (!studentId) {
        return reply.status(400).send({ error: "studentId là bắt buộc" });
      }
      const result = await this.service.addStudent(user, request.params.id, studentId);
      return reply.status(201).send(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async removeStudent(request: FastifyRequest<{ Params: { id: string; studentId: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      await this.service.removeStudent(user, request.params.id, request.params.studentId);
      return reply.send({ success: true });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }

  async recordAttendance(request: FastifyRequest<{ Params: { id: string }; Body: { records: any[] } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { records = [] } = request.body || {};
      const result = await this.service.recordAttendance(user, request.params.id, records);
      return reply.send(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
}
