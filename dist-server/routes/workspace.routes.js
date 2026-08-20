import { WorkspaceService } from '../services/workspace.service.js';
const workspaceRoutes = async (fastify) => {
    const workspaceService = new WorkspaceService(fastify.prisma);
    // GET /me/workspace - Unified Domain Workspace ViewModel
    fastify.get('/workspace', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const workspace = await workspaceService.getStudentWorkspace(user.id);
        return reply.send({ success: true, data: workspace });
    });
};
export default workspaceRoutes;
