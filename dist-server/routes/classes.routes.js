import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { ClassController } from "../controllers/class.controller.js";
export default async function classesRoutes(fastify) {
    const controller = new ClassController(fastify);
    // GET /classes/my-classes — Danh sách lớp học của học viên đang đăng nhập
    // PHẢI được đăng ký TRƯỚC /:id để Fastify không nhầm "my-classes" là classId
    fastify.get("/my-classes", { preHandler: authenticate }, async (request, reply) => {
        return controller.getMyClasses(request, reply);
    });
    // GET /classes - Lấy danh sách lớp
    fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
        return controller.list(request, reply);
    });
    // GET /classes/:id - Chi tiết lớp học
    fastify.get("/:id", { preHandler: authenticate }, async (request, reply) => {
        return controller.getById(request, reply);
    });
    // POST /classes - Tạo lớp mới
    fastify.post("/", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        return controller.create(request, reply);
    });
    // PUT /classes/:id - Cập nhật lớp
    fastify.put("/:id", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        return controller.update(request, reply);
    });
    // POST /classes/:id/students - Thêm học viên vào lớp
    fastify.post("/:id/students", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        return controller.addStudent(request, reply);
    });
    // DELETE /classes/:id/students/:studentId - Xóa học viên khỏi lớp
    fastify.delete("/:id/students/:studentId", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        return controller.removeStudent(request, reply);
    });
}
