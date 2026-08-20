import { FastifyPluginAsync } from 'fastify';
import { LessonService } from '../services/lesson.service.js';

const lessonRoutes: FastifyPluginAsync = async (fastify) => {
  const lessonService = new LessonService(fastify.prisma);

  // Projection: GET /api/v1/classes/:classId/lessons (Class Lesson Viewer & Progress)
  fastify.get('/classes/:classId/lessons', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; roles: string[] };
    const { classId } = request.params as { classId: string };

    const projection = await lessonService.getClassLessonProjection(classId, user.id, user.roles || ['student']);
    return reply.send({ success: true, data: projection });
  });

  // Projection: GET /api/v1/classes/:classId/progress (Dynamic Progress Tracking)
  fastify.get('/classes/:classId/progress', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; roles: string[] };
    const { classId } = request.params as { classId: string };

    const progress = await lessonService.getClassProgressProjection(classId, user.id, user.roles || ['student']);
    return reply.send({ success: true, data: progress });
  });
};

export default lessonRoutes;
