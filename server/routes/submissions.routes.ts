import { FastifyInstance } from "fastify";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { SubmissionController } from "../controllers/submission.controller.js";

export default async function submissionsRoutes(fastify: FastifyInstance) {
  const controller = new SubmissionController(fastify);

  // GET /submissions - List submissions (with role-based filtering)
  fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
    return controller.list(request, reply);
  });

  // POST /submissions - Start an exam attempt
  fastify.post("/", { preHandler: authenticate }, async (request: any, reply) => {
    return controller.start(request, reply);
  });

  // POST /submissions/revision - Start a revision attempt (P1 Learning Loop)
  fastify.post<{ Body: { examId: string; clonePreviousAnswers?: boolean } }>(
    "/revision",
    { preHandler: authenticate },
    async (request: any, reply) => {
      return controller.startRevision(request, reply);
    }
  );

  // GET /submissions/:id - Get submission detail (with student/teacher ownership check)
  fastify.get<{ Params: { id: string } }>("/:id", { preHandler: authenticate }, async (request, reply) => {
    return controller.getById(request, reply);
  });

  // PUT /submissions/:id - Autosave draft answers
  fastify.put<{ Params: { id: string }; Body: { answers: any[]; version?: number } }>(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      return controller.saveDraft(request, reply);
    }
  );

  // POST /submissions/:id/submit - Finalize submission with canonical scoring
  fastify.post<{ Params: { id: string }; Body: { answers: any[]; idempotencyKey?: string; version?: number } }>(
    "/:id/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      return controller.submit(request, reply);
    }
  );

  // POST /submissions/:id/grade - Manual teacher grading (essay / speaking)
  fastify.post<{
    Params: { id: string };
    Body: {
      grades: any[];
      totalScore?: number;
      feedback?: string;
      primaryErrorCategory?: "CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR" | null;
      revisionRequired?: boolean;
      criteriaScores?: any;
    };
  }>(
    "/:id/grade",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.grade(request, reply);
    }
  );

  // POST /submissions/:id/regrade - Authorized regrade workflow with audit trail
  fastify.post<{ Params: { id: string }; Body: { reason: string; grades?: any[]; regradeAll?: boolean } }>(
    "/:id/regrade",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.regrade(request, reply);
    }
  );
}
