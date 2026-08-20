import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { SubmissionController } from "../controllers/submission.controller.js";
export default async function submissionsRoutes(fastify) {
    const controller = new SubmissionController(fastify);
    // GET /submissions - List submissions (with role-based filtering)
    fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
        return controller.list(request, reply);
    });
    // POST /submissions - Start an exam attempt
    fastify.post("/", { preHandler: authenticate }, async (request, reply) => {
        return controller.start(request, reply);
    });
    // POST /submissions/revision - Start a revision attempt (P1 Learning Loop)
    fastify.post("/revision", { preHandler: authenticate }, async (request, reply) => {
        return controller.startRevision(request, reply);
    });
    // GET /submissions/:id - Get submission detail (with student/teacher ownership check)
    fastify.get("/:id", { preHandler: authenticate }, async (request, reply) => {
        return controller.getById(request, reply);
    });
    // PUT /submissions/:id - Autosave draft answers
    fastify.put("/:id", { preHandler: authenticate }, async (request, reply) => {
        return controller.saveDraft(request, reply);
    });
    // POST /submissions/:id/submit - Finalize submission with canonical scoring
    fastify.post("/:id/submit", { preHandler: authenticate }, async (request, reply) => {
        return controller.submit(request, reply);
    });
    // POST /submissions/:id/grade - Manual teacher grading (essay / speaking)
    fastify.post("/:id/grade", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        return controller.grade(request, reply);
    });
    // POST /submissions/:id/regrade - Authorized regrade workflow with audit trail
    fastify.post("/:id/regrade", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        return controller.regrade(request, reply);
    });
}
