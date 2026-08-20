import { FastifyPluginAsync } from 'fastify';
import { InvitationService } from '../services/invitation.service.js';
import { AuthorizationError, NotFoundError } from '../services/authorization.service.js';
import { requireRoles } from '../middlewares/auth.middleware.js';
import { joinByCodeSchema, createInvitationSchema } from '../validations/schemas.js';

const invitationRoutes: FastifyPluginAsync = async (fastify) => {
  const invitationService = new InvitationService(fastify.prisma);

  // Student joins class via invite code (Zero-friction)
  fastify.post('/join', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    const body = joinByCodeSchema.parse(request.body);

    const result = await invitationService.joinClassByCode(user.id, body.inviteCode);
    return reply.send(result);
  });

  // Admin/Teacher generates invite code (Admin or Class Teacher only)
  fastify.post('/generate', { preHandler: [fastify.authenticate, requireRoles('admin', 'teacher')] }, async (request, reply) => {
    const user = request.user as { id: string; roles: string[] };
    const body = createInvitationSchema.parse(request.body);

    try {
      const invitation = await invitationService.generateInvitation(
        body.classId,
        user.id,
        user.roles || ['teacher'],
        body.inviteCode,
        body.expiresInDays
      );
      return reply.send({ success: true, invitation });
    } catch (err: any) {
      if (err instanceof AuthorizationError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      if (err instanceof NotFoundError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default invitationRoutes;
