import { LeadService } from "../services/lead.service.js";
import { createLeadSchema, updateLeadSchema, listLeadsQuerySchema, } from "../schemas/lead.schema.js";
import { handleValidation } from "../utils/validation.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
const leadRoutes = async (fastify) => {
    const leadService = new LeadService(fastify.prisma);
    // POST /leads - Public endpoint for prospective students submitting consultation requests
    fastify.post("/", async (request, reply) => {
        const validatedData = handleValidation(createLeadSchema.safeParse(request.body), request, reply);
        if (!validatedData)
            return;
        try {
            const lead = await leadService.createLead(validatedData);
            return reply.status(201).send({
                success: true,
                message: "Gửi yêu cầu tư vấn thành công! Ban Học Thuật ARIS đã tiếp nhận thông tin.",
                data: {
                    id: lead.id,
                    fullName: lead.fullName,
                    phone: lead.phone,
                    createdAt: lead.createdAt,
                },
            });
        }
        catch (err) {
            request.log.error(err, "Failed to create consultation lead");
            return reply.status(500).send({
                success: false,
                error: "Không thể xử lý yêu cầu lúc này. Vui lòng liên hệ Hotline 0933.319.693.",
            });
        }
    });
    // GET /leads - Admin/Teacher list all leads with pagination
    fastify.get("/", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const validatedQuery = handleValidation(listLeadsQuerySchema.safeParse(request.query), request, reply);
        if (!validatedQuery)
            return;
        const result = await leadService.listLeads(validatedQuery);
        return reply.send({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    });
    // GET /leads/:id - Admin/Teacher get single lead details
    fastify.get("/:id", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { id } = request.params;
        const lead = await leadService.getLeadById(id);
        if (!lead) {
            return reply.status(404).send({
                success: false,
                error: "Không tìm thấy thông tin tư vấn",
            });
        }
        return reply.send({
            success: true,
            data: lead,
        });
    });
    // PATCH /leads/:id - Admin/Teacher update status or notes
    fastify.patch("/:id", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { id } = request.params;
        const validatedData = handleValidation(updateLeadSchema.safeParse(request.body), request, reply);
        if (!validatedData)
            return;
        try {
            const updated = await leadService.updateLead(id, validatedData);
            return reply.send({
                success: true,
                data: updated,
            });
        }
        catch (err) {
            return reply.status(404).send({
                success: false,
                error: "Không tìm thấy lead hoặc không thể cập nhật",
            });
        }
    });
    // DELETE /leads/:id - Admin only delete lead
    fastify.delete("/:id", { preHandler: [authenticate, requireRoles("admin")] }, async (request, reply) => {
        const { id } = request.params;
        try {
            await leadService.deleteLead(id);
            return reply.send({
                success: true,
                message: "Đã xóa lead thành công",
            });
        }
        catch (err) {
            return reply.status(404).send({
                success: false,
                error: "Không tìm thấy lead",
            });
        }
    });
};
export default leadRoutes;
