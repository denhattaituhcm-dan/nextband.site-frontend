import { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { AttendanceService } from '../services/attendance.service.js';
import { AuthorizationService, AuthorizationError, NotFoundError } from '../services/authorization.service.js';

const markAttendanceSchema = z.object({
  items: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(['UNMARKED', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      note: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
  ),
});

const attendanceRoutes: FastifyPluginAsync = async (fastify: any) => {
  const prisma = fastify.prisma;
  const attendanceService = new AttendanceService(prisma);
  const authService = new AuthorizationService(prisma);

  // 1. GET /classes/:classId/sessions/:sessionId/attendance
  fastify.get(
    '/classes/:classId/sessions/:sessionId/attendance',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user;
      const { classId, sessionId } = request.params;

      try {
        const data = await attendanceService.getSessionAttendance(
          classId,
          sessionId,
          user.id,
          user.roles || ['student']
        );
        return reply.send({ success: true, data });
      } catch (err: any) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  // 2. POST /classes/:classId/sessions/:sessionId/attendance
  fastify.post(
    '/classes/:classId/sessions/:sessionId/attendance',
    { preHandler: [authenticate, requireRoles('admin', 'teacher')] },
    async (request: any, reply: any) => {
      const user = request.user;
      const { classId, sessionId } = request.params;
      const body = markAttendanceSchema.parse(request.body);

      try {
        const result = await attendanceService.markSessionAttendance(
          classId,
          sessionId,
          user.id,
          user.roles || [],
          body.items
        );
        return reply.send(result);
      } catch (err: any) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode) {
          const isCompletedErr = err.message?.includes('SESSION_ALREADY_COMPLETED');
          const isInvalidEnrollment = err.message?.includes('INVALID_ENROLLMENT_STUDENT');

          if (isCompletedErr) {
            return reply.status(403).send({
              error: 'SESSION_ALREADY_COMPLETED',
              message: err.message,
            });
          }
          if (isInvalidEnrollment) {
            return reply.status(400).send({
              error: 'INVALID_ENROLLMENT_STUDENT',
              message: err.message,
            });
          }
          return reply.status(err.statusCode || 403).send({
            error: err.message,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  // 3. POST /classes/:classId/sessions/:sessionId/complete
  fastify.post(
    '/classes/:classId/sessions/:sessionId/complete',
    { preHandler: [authenticate, requireRoles('admin', 'teacher')] },
    async (request: any, reply: any) => {
      const user = request.user;
      const { classId, sessionId } = request.params;

      try {
        const result = await attendanceService.completeSession(
          classId,
          sessionId,
          user.id,
          user.roles || []
        );
        return reply.send({ success: true, message: result.message });
      } catch (err: any) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        if (err.message && err.message.includes('chưa được điểm danh')) {
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  // 4. GET /classes/:classId/attendance-matrix
  fastify.get(
    '/classes/:classId/attendance-matrix',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user;
      const { classId } = request.params;

      try {
        const data = await attendanceService.getAttendanceMatrix(
          classId,
          user.id,
          user.roles || ['student']
        );
        return reply.send({ success: true, data });
      } catch (err: any) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  // 5. GET /classes/:classId/sessions - Danh sách toàn bộ buổi học của lớp
  fastify.get(
    '/classes/:classId/sessions',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const { classId } = request.params;
      const sessions = await prisma.classSession.findMany({
        where: { classId },
        orderBy: { sessionNumber: 'asc' },
        include: { lesson: true },
      });

      const mapped = sessions.map((s: any) => ({
        id: s.id,
        classId: s.classId,
        sessionNumber: s.sessionNumber,
        title: s.title || s.lesson?.title || `Buổi ${s.sessionNumber}`,
        sessionDate: s.sessionDate,
        plannedDate: s.sessionDate,
        startTime: s.startTime || null,
        endTime: s.endTime || null,
        status: s.status,
        note: s.notes || null,
        rescheduleReason: null,
        completedAt: s.completedAt || null,
      }));

      return reply.send(mapped);
    },
  );

  // 6. POST /classes/:classId/sessions/:sessionId/unlock - Mở lại điểm danh buổi học đã chốt
  fastify.post(
    '/classes/:classId/sessions/:sessionId/unlock',
    { preHandler: [authenticate, requireRoles('admin', 'teacher')] },
    async (request: any, reply: any) => {
      const user = request.user;
      const { classId, sessionId } = request.params;

      try {
        await authService.requireClassTeacherOrAdmin({
          userId: user.id,
          userRoles: user.roles || [],
          classId,
        });

        const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
        if (!session || session.classId !== classId) {
          return reply.status(404).send({ error: 'Buổi học không hợp lệ hoặc không thuộc lớp này.' });
        }

        await prisma.classSession.update({
          where: { id: sessionId },
          data: {
            status: 'SCHEDULED',
            completedAt: null,
            completedBy: null,
          },
        });

        return reply.send({ success: true, message: 'Đã mở lại điểm danh buổi học thành công.' });
      } catch (err: any) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  // 7. POST /classes/:classId/sessions/generate - Sinh hàng loạt buổi học từ lịch học
  fastify.post(
    '/classes/:classId/sessions/generate',
    { preHandler: [authenticate, requireRoles('admin', 'teacher')] },
    async (request: any, reply: any) => {
      const user = request.user;
      const { classId } = request.params;
      const { startDate, weekdays = [1, 3, 5], totalSessions = 24, startTime = '18:00', endTime = '20:00' } = request.body || {};

      try {
        const cls = await authService.requireClassTeacherOrAdmin({
          userId: user.id,
          userRoles: user.roles || [],
          classId,
        });

        // Find lessons for course
        const lessons = await prisma.lesson.findMany({
          where: { courseId: cls.courseId },
          orderBy: { lessonOrder: 'asc' },
        });

        const dates: string[] = [];
        const [y, m, d] = (startDate || new Date().toISOString().slice(0, 10)).split('-').map(Number);
        const cur = new Date(y, m - 1, d);

        while (dates.length < totalSessions) {
          const dow = cur.getDay();
          if (weekdays.includes(dow)) {
            const mm = String(cur.getMonth() + 1).padStart(2, '0');
            const dd = String(cur.getDate()).padStart(2, '0');
            dates.push(`${cur.getFullYear()}-${mm}-${dd}`);
          }
          cur.setDate(cur.getDate() + 1);
        }

        const createdSessions = [];
        for (let i = 0; i < dates.length; i++) {
          const sessionNum = i + 1;
          const sessionDate = new Date(dates[i]);
          const lesson = lessons[i] || lessons[0] || null;
          const title = lesson?.title || `Lesson ${sessionNum}`;

          const sess = await prisma.classSession.create({
            data: {
              id: crypto.randomUUID(),
              classId,
              lessonId: lesson?.id || 'default-lesson-id',
              sessionNumber: sessionNum,
              title,
              sessionDate,
              status: 'SCHEDULED',
            },
          });
          createdSessions.push({
            id: sess.id,
            sessionNumber: sessionNum,
            sessionDate: dates[i],
            title,
            status: 'SCHEDULED',
          });
        }

        return reply.send(createdSessions);
      } catch (err: any) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    },
  );
};

export default attendanceRoutes;
