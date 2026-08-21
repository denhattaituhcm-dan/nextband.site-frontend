import { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { paginationSchema } from "../schemas/common.schema.js";
import {
  createCourseSchema,
  updateCourseSchema,
  CreateCourseInput,
  UpdateCourseInput,
} from "../schemas/course.schema.js";
import { authenticate, optionalAuthenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { handleValidation } from "../utils/validation.js";
import { toFileUrl, withFileUrls } from "../utils/file.js";
import { verifyPassword } from "../utils/password.js";

const coursesRoutes: FastifyPluginAsync = async (fastify) => {
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const buildUniqueSlug = async (baseInput: string, excludeId?: string) => {
    const base = slugify(baseInput) || "course";
    let candidate = base;
    let counter = 2;

    while (true) {
      const existing = await fastify.prisma.course.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) return candidate;
      candidate = `${base}-${counter}`;
      counter += 1;
    }
  };

  // GET /courses - List all courses (public with optional auth)
  fastify.get("/", { preHandler: optionalAuthenticate }, async (request, reply) => {
    const query = paginationSchema.safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send({ error: "Tham số truy vấn không hợp lệ" });
    }

    const { page, limit, search, sortBy = "createdAt", sortOrder } = query.data;
    const skip = (page - 1) * limit;
    const { level, isActive, isPublished } = request.query as any;

    const where: any = {};
    const currentUser = (request as any).user;

    // Role-based visibility
    if (!currentUser) {
      // Guest: show published and active courses
      where.isPublished = true;
      where.isActive = true;
    } else {
      const hasAdminOrTeacherRole = currentUser?.roles?.some((r: string) =>
        ["admin", "teacher"].includes(r),
      );

      if (!hasAdminOrTeacherRole) {
        // Student: show published active courses or courses student is enrolled in
        where.OR = [
          { enrollments: { some: { studentId: currentUser?.id } } },
          { isPublished: true, isActive: true },
        ];
      } else {
        // Admin/Teacher: hide soft-deleted courses by default, or respect query filters
        if (isActive !== undefined) {
          where.isActive = isActive === "true" || isActive === true;
        } else {
          where.isActive = true;
        }
        if (isPublished !== undefined) {
          where.isPublished = isPublished === "true" || isPublished === true;
        }
      }
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (level && level !== "all") {
      where.level = level;
    }

    const sortFieldMap: Record<string, string> = {
      newest: "createdAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      name: "title",
      title: "title",
      level: "level",
      price: "price",
    };
    const orderField = (sortBy && sortFieldMap[sortBy]) ? sortFieldMap[sortBy] : "createdAt";

    const [data, total] = await Promise.all([
      fastify.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: { exams: true, enrollments: true, lessons: true, classes: true },
          },
        },
      }),
      fastify.prisma.course.count({ where }),
    ]);

    const courses = data.map((c) => ({
      ...c,
      thumbnailUrl: toFileUrl(c.thumbnailUrl),
      teacher: c.creator
        ? {
            ...c.creator,
            avatarUrl: toFileUrl(c.creator.avatarUrl),
          }
        : null,
    }));

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // GET /courses/:id - Get course by ID
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: optionalAuthenticate },
    async (request, reply) => {
      const { id } = request.params;
      const currentUser = (request as any).user;

      const course = await fastify.prisma.course.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          exams: {
            where: { isActive: true },
            orderBy: { week: "asc" },
          },
        },
      });

      if (!course) {
        return reply.status(404).send({ error: "Không tìm thấy khóa học" });
      }

      const hasAdminOrTeacherRole = currentUser?.roles?.some((r: string) =>
        ["admin", "teacher"].includes(r),
      );

      if (!hasAdminOrTeacherRole) {
        if (!course.isActive || !course.isPublished) {
          return reply.status(404).send({ error: "Không tìm thấy khóa học" });
        }
      }

      return {
        ...course,
        thumbnailUrl: toFileUrl(course.thumbnailUrl),
        teacher: course.creator
          ? {
              ...course.creator,
              avatarUrl: toFileUrl(course.creator.avatarUrl),
            }
          : null,
      };
    },
  );

  // GET /courses/slug/:slug - Get course by slug
  fastify.get<{ Params: { slug: string } }>(
    "/slug/:slug",
    { preHandler: optionalAuthenticate },
    async (request, reply) => {
      const { slug } = request.params;
      const currentUser = (request as any).user;

      const course = await fastify.prisma.course.findUnique({
        where: { slug },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          exams: {
            where: { isActive: true, isPublished: true },
            orderBy: { week: "asc" },
          },
        },
      });

      if (!course) {
        return reply.status(404).send({ error: "Course not found" });
      }

      const hasAdminOrTeacherRole = currentUser?.roles?.some((r: string) =>
        ["admin", "teacher"].includes(r),
      );

      if (!hasAdminOrTeacherRole) {
        if (!course.isActive || !course.isPublished) {
          return reply.status(404).send({ error: "Course not found" });
        }
      }

      return {
        ...course,
        thumbnailUrl: toFileUrl(course.thumbnailUrl),
        teacher: course.creator
          ? {
              ...course.creator,
              avatarUrl: toFileUrl(course.creator.avatarUrl),
            }
          : null,
      };
    },
  );

  // POST /courses - Create course (admin/teacher only)
  fastify.post<{ Body: CreateCourseInput }>(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const data = handleValidation(
        createCourseSchema.safeParse(request.body),
        request,
        reply,
      );
      if (!data) return;

      const { id: teacherId } = request.user;

      if (!data.slug && data.title) {
        data.slug = await buildUniqueSlug(data.title);
      } else if (data.slug) {
        const existingSlug = await fastify.prisma.course.findFirst({
          where: { slug: data.slug },
          select: { id: true },
        });
        if (existingSlug) {
          return reply.status(409).send({ error: "Slug khóa học đã tồn tại" });
        }
      }

      try {
        const { isLocked: _ignoredIsLocked, ...safeData } = data as any;
        const course = await fastify.prisma.course.create({
          data: {
            ...safeData,
            price: safeData.price || 0,
            teacherId,
          },
        });

        return reply.status(201).send(withFileUrls(course, ["thumbnailUrl"]));
      } catch (error: any) {
        if (error?.code === "P2002") {
          return reply.status(409).send({ error: "Slug khóa học đã tồn tại" });
        }
        throw error;
      }
    },
  );

  // PUT /courses/:id - Update course (admin/teacher only)
  fastify.put<{ Params: { id: string }; Body: UpdateCourseInput }>(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateCourseSchema.safeParse(request.body),
        request,
        reply,
      );
      if (!data) return;

      // Check if course exists
      const existing = await fastify.prisma.course.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Không tìm thấy khóa học" });
      }

      if (data.slug) {
        const existingSlug = await fastify.prisma.course.findFirst({
          where: {
            slug: data.slug,
            id: { not: id },
          },
          select: { id: true },
        });
        if (existingSlug) {
          return reply.status(409).send({ error: "Slug khóa học đã tồn tại" });
        }
      }

      let updateData: any = data;
      if (!data.slug && data.title && data.title !== existing.title) {
        updateData = {
          ...data,
          slug: await buildUniqueSlug(data.title, id),
        };
      }
      const { isLocked: _ignoredIsLocked, ...safeUpdateData } = updateData;

      try {
        const course = await fastify.prisma.course.update({
          where: { id },
          data: safeUpdateData,
        });

        return withFileUrls(course, ["thumbnailUrl"]);
      } catch (error: any) {
        if (error?.code === "P2002") {
          return reply.status(409).send({ error: "Slug khóa học đã tồn tại" });
        }
        throw error;
      }
    },
  );

  // DELETE /courses/:id - Delete course (admin only)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      const { password } = (request.body || {}) as { password?: string };

      const actor = await fastify.prisma.user.findFirst({
        where: { userId: request.user.id },
      });
      if (!actor) {
        return reply.status(401).send({ error: "Không thể xác thực người dùng" });
      }

      const existing = await fastify.prisma.course.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Không tìm thấy khóa học" });
      }

      const lockRows = await fastify.prisma.$queryRaw<
        Array<{ is_locked: number | boolean | null }>
      >(Prisma.sql`SELECT is_locked FROM courses WHERE id = ${id} LIMIT 1`);
      const isLocked = Boolean(lockRows[0]?.is_locked);

      if (isLocked) {
        return reply.status(423).send({
          error: "Khóa học đang bị khóa. Hãy mở khóa trước khi xóa",
        });
      }

      const [enrollmentCount, submissionCount] = await Promise.all([
        fastify.prisma.enrollment.count({ where: { courseId: id } }),
        fastify.prisma.examSubmission.count({
          where: { exam: { courseId: id } },
        }),
      ]);

      if (enrollmentCount > 0 || submissionCount > 0) {
        return reply.status(409).send({
          error:
            "Không thể xóa khóa học khi vẫn còn học viên hoặc bài nộp liên quan",
        });
      }

      await fastify.prisma.course.update({
        where: { id },
        data: {
          isActive: false,
          isPublished: false,
        },
      });

      return { success: true, softDeleted: true };
    },
  );
};

export default coursesRoutes;
