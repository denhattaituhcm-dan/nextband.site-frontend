import { paginationSchema } from "../schemas/common.schema.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { hashPassword } from "../utils/password.js";
import { handleValidation } from "../utils/validation.js";
import { withFileUrls, withFileUrlsMany } from "../utils/file.js";
import { getTeacherStudentIds, isStudentInTeacherClasses, } from "../utils/teacherScope.js";
const usersRoutes = async (fastify) => {
    // GET /users - List users (admin/teacher only)
    fastify.get("/", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const dataQuery = handleValidation(paginationSchema.safeParse(request.query), request, reply);
        if (!dataQuery)
            return;
        const { role } = request.query;
        const { page, limit, search, sortBy = "createdAt", sortOrder, } = dataQuery;
        const skip = (page - 1) * limit;
        const where = {};
        // Teacher: only see students in their classes
        const user = request.user;
        const isAdmin = user.roles.includes("admin");
        const isTeacher = user.roles.includes("teacher");
        if (isTeacher && !isAdmin) {
            const teacherStudentIds = await getTeacherStudentIds(fastify.prisma, user.id);
            where.userId = { in: teacherStudentIds };
        }
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { fullName: { contains: search } },
            ];
        }
        if (role) {
            where.roles = {
                some: { role },
            };
        }
        const [data, total] = await Promise.all([
            fastify.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    gender: true,
                    dateOfBirth: true,
                    phone: true,
                    parentName: true,
                    parentPhone: true,
                    isActive: true,
                    createdAt: true,
                    roles: true,
                    _count: {
                        select: { enrollments: true, submissions: true },
                    },
                },
            }),
            fastify.prisma.user.count({ where }),
        ]);
        const users = data.map((u) => ({
            ...u,
            roles: u.roles.map((r) => r.role),
        }));
        return {
            data: withFileUrlsMany(users, ["avatarUrl"]),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    });
    // GET /users/students-management - Real-data Student Management View Model DTO
    fastify.get("/students-management", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { page = 1, limit = 10, search } = (request.query || {});
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const user = request.user;
        const isAdmin = user.roles.includes("admin");
        const isTeacher = user.roles.includes("teacher");
        const where = {
            roles: {
                some: { role: "student" },
            },
        };
        if (isTeacher && !isAdmin) {
            const teacherStudentIds = await getTeacherStudentIds(fastify.prisma, user.id);
            where.id = { in: teacherStudentIds };
        }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } },
            ];
        }
        const [studentsData, total] = await Promise.all([
            fastify.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    classesAsStudent: {
                        include: {
                            class: {
                                select: { id: true, name: true, courseId: true, course: { select: { id: true, title: true } } }
                            }
                        }
                    },
                    submissions: {
                        select: { id: true, status: true, totalScore: true, submittedAt: true, exam: { select: { title: true } } }
                    },
                    attendanceRecords: {
                        select: { id: true, status: true, createdAt: true }
                    }
                }
            }),
            fastify.prisma.user.count({ where }),
        ]);
        const items = await Promise.all(studentsData.map(async (st) => {
            // 1. Classes array (Deduplicated per student)
            const classesMap = new Map();
            (st.classesAsStudent || []).forEach((cs) => {
                if (cs.class) {
                    classesMap.set(cs.class.id, {
                        id: cs.class.id,
                        name: cs.class.name,
                        courseId: cs.class.courseId,
                        courseTitle: cs.class.course?.title || undefined,
                    });
                }
            });
            const classes = Array.from(classesMap.values());
            // 2. Exam & Submissions stats (Canonical exam_submissions)
            const examSubs = st.submissions || [];
            const totalAssignedCount = examSubs.length;
            const submittedCount = examSubs.filter((s) => s.status === "submitted" || s.status === "graded" || s.status === "SUBMITTED" || s.status === "GRADED").length;
            const gradedCount = examSubs.filter((s) => s.status === "graded" || s.status === "GRADED").length;
            // 3. Attendance stats
            const attendances = st.attendanceRecords || [];
            const totalSessions = attendances.length;
            const attendedCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "present").length;
            const attendancePercentage = totalSessions > 0
                ? Math.round((attendedCount / totalSessions) * 100)
                : null;
            // 5. Last Activity
            let lastActivity = null;
            const allActivities = [];
            examSubs.forEach((s) => {
                if (s.submittedAt) {
                    allActivities.push({
                        type: "submission",
                        title: s.exam?.title || "Bài thi",
                        score: s.totalScore ? Number(s.totalScore) : null,
                        timestamp: new Date(s.submittedAt).toISOString(),
                    });
                }
            });
            if (allActivities.length > 0) {
                allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                lastActivity = allActivities[0];
            }
            // 6. Server Academic Health Score Calculation
            let academicHealth = null;
            if (totalAssignedCount > 0) {
                const hwProgressRatio = submittedCount / totalAssignedCount;
                const gradedRatio = submittedCount > 0 ? (gradedCount / submittedCount) : 0;
                if (totalSessions > 0) {
                    const attRatio = attendedCount / totalSessions;
                    const score = (attRatio * 0.3 + hwProgressRatio * 0.4 + gradedRatio * 0.3) * 100;
                    academicHealth = Math.round(score);
                }
                else {
                    const score = (hwProgressRatio * 0.6 + gradedRatio * 0.4) * 100;
                    academicHealth = Math.round(score);
                }
            }
            return {
                id: st.id,
                fullName: st.fullName || st.email.split("@")[0],
                email: st.email,
                avatarUrl: st.avatarUrl,
                phone: st.phone,
                isActive: st.isActive,
                createdAt: st.createdAt,
                classes,
                homework: {
                    submittedCount,
                    gradedCount,
                    totalAssignedCount: submittedCount,
                    percentage: submittedCount > 0 ? 100 : null,
                },
                attendance: {
                    attendedCount,
                    totalSessions,
                    percentage: attendancePercentage,
                },
                lastActivity,
                academicHealth,
            };
        }));
        return reply.send({
            success: true,
            data: withFileUrlsMany(items, ["avatarUrl"]),
            meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        });
    });
    // GET /users/:id
    fastify.get("/:id", { preHandler: [authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
        const { id } = request.params;
        const user = await fastify.prisma.user.findUnique({
            where: { userId: id },
            select: {
                id: true,
                userId: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                bio: true,
                isActive: true,
                createdAt: true,
                roles: true,
                enrollments: {
                    include: { course: { select: { id: true, title: true } } },
                },
            },
        });
        if (!user) {
            return reply.status(404).send({ error: "Không tìm thấy người dùng" });
        }
        // Teacher: check if this user is a student in their classes
        const currentUser = request.user;
        const isCurrentAdmin = currentUser.roles.includes("admin");
        const isCurrentTeacher = currentUser.roles.includes("teacher");
        if (isCurrentTeacher && !isCurrentAdmin) {
            const hasAccess = await isStudentInTeacherClasses(fastify.prisma, currentUser.id, id);
            if (!hasAccess) {
                return reply
                    .status(403)
                    .send({
                    error: "Từ chối truy cập - người dùng không thuộc lớp bạn phụ trách",
                });
            }
        }
        const userWithRoles = {
            ...user,
            id: user.userId,
            roles: user.roles.map((r) => r.role),
        };
        return withFileUrls(userWithRoles, ["avatarUrl"]);
    });
    // POST /users - Create user (admin only with idempotency & compensation rollback protection)
    fastify.post("/", { preHandler: [authenticate, requireRoles("admin")] }, async (request, reply) => {
        const { email, password, fullName, role = "student", gender, dateOfBirth, phone, parentName, parentPhone, } = request.body;
        if (!email || typeof email !== "string" || !email.includes("@")) {
            return reply.status(400).send({ error: "Email không hợp lệ" });
        }
        // 1. Idempotency Check: Prevent duplicate user registration
        const existing = await fastify.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
        if (existing) {
            return reply.status(409).send({ error: "Email đã tồn tại trong hệ thống" });
        }
        const finalPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(finalPassword);
        let createdUserId = null;
        try {
            // 2. Atomic Transaction: Create user profile and role mapping together
            const user = await fastify.prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        userId: crypto.randomUUID(),
                        email: email.trim().toLowerCase(),
                        fullName,
                        gender,
                        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                        phone,
                        parentName,
                        parentPhone,
                        roles: {
                            create: { role },
                        },
                    },
                    include: { roles: true },
                });
                createdUserId = newUser.id;
                return newUser;
            });
            return reply.status(201).send({
                id: user.userId,
                email: user.email,
                fullName: user.fullName,
                roles: user.roles?.map((r) => r.role) || [role],
                createdAt: user.createdAt,
            });
        }
        catch (err) {
            // 3. Compensation Cleanup Safety: Rollback any partially created user state
            if (createdUserId) {
                try {
                    await fastify.prisma.user.delete({ where: { id: createdUserId } });
                }
                catch (cleanupErr) {
                    request.log.error(cleanupErr, "Compensation cleanup error during user creation");
                }
            }
            throw err;
        }
    });
    // PUT /users/:id - Update user (admin only)
    fastify.put("/:id", { preHandler: [authenticate, requireRoles("admin")] }, async (request, reply) => {
        const { id } = request.params;
        const { fullName, isActive, role, gender, dateOfBirth, phone, parentName, parentPhone, } = request.body;
        const user = await fastify.prisma.user.update({
            where: { userId: id },
            data: {
                ...(fullName !== undefined && { fullName }),
                ...(isActive !== undefined && { isActive }),
                ...(gender !== undefined && { gender }),
                ...(dateOfBirth !== undefined && {
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                }),
                ...(phone !== undefined && { phone }),
                ...(parentName !== undefined && { parentName }),
                ...(parentPhone !== undefined && { parentPhone }),
            },
            include: { roles: true },
        });
        // Update role if provided
        if (role) {
            await fastify.prisma.userRole.deleteMany({
                where: { userId: user.id },
            });
            await fastify.prisma.userRole.create({
                data: { userId: user.id, role },
            });
        }
        return {
            id: user.userId,
            email: user.email,
            fullName: user.fullName,
            isActive: user.isActive,
            roles: role ? [role] : user.roles.map((r) => r.role),
        };
    });
    // DELETE /users/:id - Delete user (admin only)
    fastify.delete("/:id", { preHandler: [authenticate, requireRoles("admin")] }, async (request, reply) => {
        const { id } = request.params;
        await fastify.prisma.user.delete({ where: { userId: id } });
        return { success: true };
    });
};
export default usersRoutes;
