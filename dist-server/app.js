// server/app.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import { join as join3 } from "path";
import { existsSync as existsSync3, mkdirSync as mkdirSync2 } from "fs";

// server/config/env.ts
import { z } from "zod";
import "dotenv/config";
var WEAK_SECRETS = /* @__PURE__ */ new Set([
  "secret",
  "jwt_secret",
  "supersecret",
  "123456",
  "12345678",
  "password",
  "default_secret",
  "change_me"
]);
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  APP_URL: z.string().optional(),
  // Full URL của server, VD: https://api.yourdomain.com
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET cannot be empty"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.string().default("52428800"),
  // 50MB
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  PREVIEW_ALLOWED_ORIGINS: z.string().optional(),
  TRUST_PROXY_IPS: z.string().optional(),
  // Comma-separated list of trusted proxy IPs/CIDRs
  SUPABASE_URL: z.string().default("https://gzpdlqxjggyxlkeatvvf.supabase.co"),
  SUPABASE_JWKS_URL: z.string().optional(),
  NOTIFICATION_EMAIL_TO: z.string().default("arisieltsdeeplearning@gmail.com"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional()
}).refine(
  (data) => {
    if (data.NODE_ENV === "production") {
      if (data.JWT_SECRET.length < 32) return false;
      if (WEAK_SECRETS.has(data.JWT_SECRET.toLowerCase())) return false;
    }
    return true;
  },
  {
    message: "In production, JWT_SECRET must be at least 32 characters long and cannot be a known weak/default secret.",
    path: ["JWT_SECRET"]
  }
);
var envData;
try {
  envData = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error(
      "\u274C Invalid environment variables:",
      err.flatten().fieldErrors
    );
  } else {
    console.error("\u274C Invalid environment variables:", err);
  }
  process.exit(1);
}
var env = envData;

// server/plugins/prisma.ts
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
var prismaPlugin = async (fastify) => {
  const prisma = new PrismaClient({
    log: fastify.log.level === "debug" ? ["query", "error", "warn"] : ["error"]
  });
  try {
    await prisma.$connect();
  } catch (dbErr) {
    fastify.log.warn({ err: dbErr }, "Prisma initial connection deferred in serverless runtime");
  }
  fastify.decorate("prisma", prisma);
  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
};
var prisma_default = fp(prismaPlugin, {
  name: "prisma"
});

// server/plugins/auth.ts
import fp2 from "fastify-plugin";
import jwt from "@fastify/jwt";
import { createRemoteJWKSet } from "jose";

// server/middlewares/auth.middleware.ts
import { jwtVerify } from "jose";
async function verifyAndResolveUser(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  let userId = "";
  let email = "";
  let fallbackRoles = [];
  try {
    const expectedIssuer = `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
    const { payload } = await jwtVerify(token, supabaseJWKS, {
      issuer: expectedIssuer,
      algorithms: ["ES256", "RS256"]
    });
    if (payload && payload.sub) {
      userId = payload.sub;
      email = typeof payload.email === "string" ? payload.email : "";
      if (Array.isArray(payload.roles)) {
        fallbackRoles.push(...payload.roles);
      }
      const appMeta = payload.app_metadata;
      if (appMeta?.role && typeof appMeta.role === "string") {
        fallbackRoles.push(appMeta.role);
      }
      if (Array.isArray(appMeta?.roles)) {
        fallbackRoles.push(...appMeta.roles);
      }
      const userMeta = payload.user_metadata;
      if (userMeta?.role && typeof userMeta.role === "string") {
        fallbackRoles.push(userMeta.role);
      }
      if (Array.isArray(userMeta?.roles)) {
        fallbackRoles.push(...userMeta.roles);
      }
    }
  } catch (jwksErr) {
    try {
      const fastifyJwt = request.server.jwt;
      if (fastifyJwt) {
        const decoded = fastifyJwt.verify(token);
        if (decoded) {
          userId = decoded.id || decoded.sub || "";
          email = decoded.email || "";
          if (Array.isArray(decoded.roles)) {
            fallbackRoles = decoded.roles;
          }
        }
      }
    } catch (hsErr) {
      return null;
    }
  }
  if (!userId) return null;
  let canonicalUserId = userId;
  let authoritativeRoles = [];
  try {
    const prisma = request.server.prisma;
    if (prisma && prisma.user) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { userId },
            { id: userId },
            ...email ? [{ email }] : []
          ]
        },
        include: { roles: true }
      });
      if (dbUser) {
        canonicalUserId = dbUser.userId || dbUser.id;
        authoritativeRoles = dbUser.roles.map((r) => r.role);
      }
    }
  } catch (dbErr) {
    request.log.warn({ err: dbErr, userId, email }, "Failed to fetch user from PostgreSQL, using fallback");
  }
  const finalRoles = authoritativeRoles.length > 0 ? authoritativeRoles : fallbackRoles.length > 0 ? fallbackRoles : ["student"];
  const userContext = {
    id: canonicalUserId,
    email,
    roles: finalRoles
  };
  request.user = userContext;
  return userContext;
}
async function authenticate(request, reply) {
  const user = await verifyAndResolveUser(request);
  if (!user) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}
async function optionalAuthenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    request.user = null;
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
  }
  const user = await verifyAndResolveUser(request);
  if (!user) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
  }
  request.user = {
    id: user.id,
    email: user.email,
    roles: user.roles || []
  };
}
function requireRoles(...roles) {
  return async (request, reply) => {
    const user = request.user || await verifyAndResolveUser(request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
    }
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = userRoles.some((r) => roles.includes(r));
    if (!hasRole) {
      return reply.status(403).send({
        error: "Forbidden",
        message: `Required roles: ${roles.join(", ")}`
      });
    }
  };
}

// server/plugins/auth.ts
var jwksUrl = env.SUPABASE_JWKS_URL || `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
var supabaseJWKS = createRemoteJWKSet(new URL(jwksUrl));
var authPlugin = async (fastify) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });
  fastify.decorate("authenticate", authenticate);
};
var auth_default = fp2(authPlugin, {
  name: "auth",
  dependencies: ["prisma"]
});

// server/schemas/auth.schema.ts
import { z as z2 } from "zod";
var loginSchema = z2.object({
  email: z2.string().email("\u0110\u1ECBnh d\u1EA1ng email kh\xF4ng h\u1EE3p l\u1EC7"),
  password: z2.string().min(6, "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1")
});
var registerSchema = z2.object({
  email: z2.string().email("\u0110\u1ECBnh d\u1EA1ng email kh\xF4ng h\u1EE3p l\u1EC7"),
  password: z2.string().min(6, "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1"),
  fullName: z2.string().min(2, "H\u1ECD t\xEAn ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1")
});
var googleLoginSchema = z2.object({
  credential: z2.string().min(1, "Y\xEAu c\u1EA7u th\xF4ng tin x\xE1c th\u1EF1c")
});

// server/routes/auth.routes.ts
import { OAuth2Client } from "google-auth-library";

// server/utils/validation.ts
function handleValidation(validation, request, reply) {
  if (!validation.success) {
    request.log.warn({
      msg: "Validation failed",
      errors: validation.error.format(),
      body: request.body,
      query: request.query,
      params: request.params
    });
    reply.status(400).send({
      error: "X\xE1c th\u1EF1c kh\xF4ng th\xE0nh c\xF4ng",
      details: validation.error.flatten().fieldErrors
    });
    return void 0;
  }
  return validation.data;
}

// server/utils/file.ts
function getBaseUrl() {
  if (env.APP_URL) return env.APP_URL;
  const port = env.PORT ?? "3000";
  return `http://localhost:${port}`;
}
function toFileUrl(path) {
  if (!path) return null;
  if (/^(https?:\/\/|data:)/i.test(path)) return path;
  const base = getBaseUrl().replace(/\/$/, "");
  const relative = path.startsWith("/") ? path : `/${path}`;
  return `${base}${relative}`;
}
function withFileUrls(obj, keys) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const key of keys) {
    result[key] = toFileUrl(obj[key]);
  }
  return result;
}
function withFileUrlsMany(arr, keys) {
  return arr.map((item) => withFileUrls(item, keys));
}

// server/routes/auth.routes.ts
var authRoutes = async (fastify) => {
  fastify.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const data = handleValidation(
        registerSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const { email, password, fullName } = data;
      const existing = await fastify.prisma.user.findUnique({
        where: { email }
      });
      if (existing) {
        return reply.status(409).send({ error: "Email \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u0103ng k\xFD" });
      }
      const user = await fastify.prisma.user.create({
        data: {
          userId: crypto.randomUUID(),
          email,
          fullName,
          roles: {
            create: { role: "student" }
          }
        },
        include: { roles: true }
      });
      const token = fastify.jwt.sign({
        id: user.userId,
        email: user.email || "",
        roles: (user.roles || []).map((r) => r.role)
      });
      return {
        token,
        user: {
          id: user.userId,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: toFileUrl(user.avatarUrl),
          phone: user.phone,
          gender: user.gender,
          roles: (user.roles || []).map((r) => r.role)
        }
      };
    }
  );
  fastify.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const data = handleValidation(
        loginSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const { email } = data;
      const user = await fastify.prisma.user.findFirst({
        where: { email },
        include: { roles: true }
      });
      if (!user) {
        return reply.status(401).send({ error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" });
      }
      if (!user.isActive) {
        return reply.status(403).send({ error: "T\xE0i kho\u1EA3n \u0111\xE3 b\u1ECB h\u1EE7y k\xEDch ho\u1EA1t" });
      }
      const token = fastify.jwt.sign({
        id: user.userId,
        email: user.email || "",
        roles: user.roles?.map((r) => r.role) || ["student"]
      });
      return {
        token,
        user: {
          id: user.userId,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: toFileUrl(user.avatarUrl),
          phone: user.phone,
          gender: user.gender,
          roles: user.roles?.map((r) => r.role) || ["student"]
        }
      };
    }
  );
  fastify.post(
    "/login/google",
    async (request, reply) => {
      const data = handleValidation(
        googleLoginSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const { credential } = data;
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      let payload;
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
      } catch (error) {
        return reply.status(401).send({ error: "Token Google kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      if (!payload || !payload.email) {
        return reply.status(400).send({ error: "Payload Token Google kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const { email, name, picture } = payload;
      let user = await fastify.prisma.user.findFirst({
        where: { email },
        include: { roles: true }
      });
      if (!user) {
        user = await fastify.prisma.user.create({
          data: {
            userId: crypto.randomUUID(),
            email,
            fullName: name || "User",
            avatarUrl: picture,
            roles: {
              create: { role: "student" }
            }
          },
          include: { roles: true }
        });
      }
      if (!user.isActive) {
        return reply.status(403).send({ error: "T\xE0i kho\u1EA3n \u0111\xE3 b\u1ECB h\u1EE7y k\xEDch ho\u1EA1t" });
      }
      const token = fastify.jwt.sign({
        id: user.userId,
        email: user.email || "",
        roles: (user.roles || []).map((r) => r.role)
      });
      return {
        token,
        user: {
          id: user.userId,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: toFileUrl(user.avatarUrl),
          phone: user.phone,
          gender: user.gender,
          roles: (user.roles || []).map((r) => r.role)
        }
      };
    }
  );
  fastify.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user;
    const user = await fastify.prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    });
    if (!user) {
      return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" });
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: toFileUrl(user.avatarUrl),
      bio: user.bio,
      phone: user.phone,
      gender: user.gender,
      roles: user.roles.map((r) => r.role)
    };
  });
  fastify.put(
    "/profile",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.user;
      const { fullName, bio, avatarUrl, phone, gender } = request.body;
      const user = await fastify.prisma.user.update({
        where: { id },
        data: {
          ...fullName && { fullName },
          ...bio !== void 0 && { bio },
          ...avatarUrl && { avatarUrl },
          ...phone !== void 0 && { phone },
          ...gender !== void 0 && { gender }
        },
        include: { roles: true }
      });
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: toFileUrl(user.avatarUrl),
        bio: user.bio,
        phone: user.phone,
        gender: user.gender,
        roles: user.roles.map((r) => r.role)
      };
    }
  );
  fastify.post(
    "/change-password",
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const { id } = request.user;
      const { currentPassword, newPassword } = request.body;
      if (!currentPassword || !newPassword) {
        return reply.status(400).send({ error: "Y\xEAu c\u1EA7u m\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i v\xE0 m\u1EADt kh\u1EA9u m\u1EDBi" });
      }
      if (newPassword.length < 6) {
        return reply.status(400).send({ error: "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1" });
      }
      const user = await fastify.prisma.user.findFirst({
        where: { userId: id }
      });
      if (!user) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" });
      }
      return { message: "M\u1EADt kh\u1EA9u \u0111\xE3 \u0111\u01B0\u1EE3c thay \u0111\u1ED5i th\xE0nh c\xF4ng" };
    }
  );
  fastify.post(
    "/verify-password",
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const { id } = request.user;
      const user = await fastify.prisma.user.findFirst({
        where: { userId: id }
      });
      if (!user) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" });
      }
      return { valid: true };
    }
  );
};
var auth_routes_default = authRoutes;

// server/routes/courses.routes.ts
import { Prisma } from "@prisma/client";

// server/schemas/common.schema.ts
import { z as z3 } from "zod";
var paginationSchema = z3.object({
  page: z3.coerce.number().min(1, "Trang ph\u1EA3i \xEDt nh\u1EA5t l\xE0 1").default(1),
  limit: z3.coerce.number().min(1, "Gi\u1EDBi h\u1EA1n ph\u1EA3i \xEDt nh\u1EA5t l\xE0 1").max(100, "Gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a l\xE0 100").default(10),
  search: z3.string().optional(),
  sortBy: z3.string().optional(),
  sortOrder: z3.enum(["asc", "desc"], {
    errorMap: () => ({ message: "Th\u1EE9 t\u1EF1 s\u1EAFp x\u1EBFp ph\u1EA3i l\xE0 'asc' ho\u1EB7c 'desc'" })
  }).default("desc")
});

// server/schemas/course.schema.ts
import { z as z4 } from "zod";
var createCourseSchema = z4.object({
  title: z4.string().min(1, "Ti\xEAu \u0111\u1EC1 l\xE0 b\u1EAFt bu\u1ED9c"),
  description: z4.string().optional().nullable(),
  thumbnailUrl: z4.string().optional().nullable(),
  level: z4.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "C\u1EA5p \u0111\u1ED9 kh\xF4ng h\u1EE3p l\u1EC7" })
  }).default("beginner"),
  price: z4.coerce.number().min(0, "Gi\xE1 kh\xF4ng \u0111\u01B0\u1EE3c nh\u1ECF h\u01A1n 0").default(0),
  syllabus: z4.any().optional().nullable(),
  slug: z4.string().optional().nullable(),
  isPublished: z4.boolean().optional().default(false),
  isActive: z4.boolean().optional().default(true),
  isLocked: z4.boolean().optional().default(false)
});
var updateCourseSchema = createCourseSchema.partial();

// server/routes/courses.routes.ts
var coursesRoutes = async (fastify) => {
  const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const buildUniqueSlug = async (baseInput, excludeId) => {
    const base = slugify(baseInput) || "course";
    let candidate = base;
    let counter = 2;
    while (true) {
      const existing = await fastify.prisma.course.findFirst({
        where: {
          slug: candidate,
          ...excludeId ? { id: { not: excludeId } } : {}
        },
        select: { id: true }
      });
      if (!existing) return candidate;
      candidate = `${base}-${counter}`;
      counter += 1;
    }
  };
  fastify.get("/", { preHandler: optionalAuthenticate }, async (request, reply) => {
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: "Tham s\u1ED1 truy v\u1EA5n kh\xF4ng h\u1EE3p l\u1EC7" });
    }
    const { page, limit, search, sortBy = "createdAt", sortOrder } = query.data;
    const skip = (page - 1) * limit;
    const { level } = request.query;
    const where = {};
    const currentUser = request.user;
    if (!currentUser) {
      where.isPublished = true;
      where.isActive = true;
    } else {
      const hasAdminOrTeacherRole = currentUser.roles?.some(
        (r) => ["admin", "teacher"].includes(r)
      );
      if (!hasAdminOrTeacherRole) {
        where.OR = [
          { enrollments: { some: { studentId: currentUser.id } } },
          { isPublished: true, isActive: true }
        ];
      } else {
        where.isActive = true;
      }
    }
    if (search) {
      where.title = { contains: search };
    }
    if (level && level !== "all") {
      where.level = level;
    }
    const [data, total] = await Promise.all([
      fastify.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true }
          },
          _count: {
            select: { exams: true, enrollments: true }
          }
        }
      }),
      fastify.prisma.course.count({ where })
    ]);
    const courses = data.map((c) => ({
      ...c,
      thumbnailUrl: toFileUrl(c.thumbnailUrl),
      teacher: c.creator ? {
        ...c.creator,
        avatarUrl: toFileUrl(c.creator.avatarUrl)
      } : null
    }));
    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  });
  fastify.get(
    "/:id",
    { preHandler: optionalAuthenticate },
    async (request, reply) => {
      const { id } = request.params;
      const currentUser = request.user;
      const course = await fastify.prisma.course.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true }
          },
          exams: {
            where: { isActive: true },
            orderBy: { week: "asc" }
          }
        }
      });
      if (!course) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y kh\xF3a h\u1ECDc" });
      }
      const hasAdminOrTeacherRole = currentUser?.roles?.some(
        (r) => ["admin", "teacher"].includes(r)
      );
      if (!hasAdminOrTeacherRole) {
        if (!course.isActive || !course.isPublished) {
          return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y kh\xF3a h\u1ECDc" });
        }
      }
      return {
        ...course,
        thumbnailUrl: toFileUrl(course.thumbnailUrl),
        teacher: course.creator ? {
          ...course.creator,
          avatarUrl: toFileUrl(course.creator.avatarUrl)
        } : null
      };
    }
  );
  fastify.get(
    "/slug/:slug",
    { preHandler: optionalAuthenticate },
    async (request, reply) => {
      const { slug } = request.params;
      const currentUser = request.user;
      const course = await fastify.prisma.course.findUnique({
        where: { slug },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true }
          },
          exams: {
            where: { isActive: true, isPublished: true },
            orderBy: { week: "asc" }
          }
        }
      });
      if (!course) {
        return reply.status(404).send({ error: "Course not found" });
      }
      const hasAdminOrTeacherRole = currentUser?.roles?.some(
        (r) => ["admin", "teacher"].includes(r)
      );
      if (!hasAdminOrTeacherRole) {
        if (!course.isActive || !course.isPublished) {
          return reply.status(404).send({ error: "Course not found" });
        }
      }
      return {
        ...course,
        thumbnailUrl: toFileUrl(course.thumbnailUrl),
        teacher: course.creator ? {
          ...course.creator,
          avatarUrl: toFileUrl(course.creator.avatarUrl)
        } : null
      };
    }
  );
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const data = handleValidation(
        createCourseSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const { id: teacherId } = request.user;
      if (!data.slug && data.title) {
        data.slug = await buildUniqueSlug(data.title);
      } else if (data.slug) {
        const existingSlug = await fastify.prisma.course.findFirst({
          where: { slug: data.slug },
          select: { id: true }
        });
        if (existingSlug) {
          return reply.status(409).send({ error: "Slug kh\xF3a h\u1ECDc \u0111\xE3 t\u1ED3n t\u1EA1i" });
        }
      }
      try {
        const { isLocked: _ignoredIsLocked, ...safeData } = data;
        const course = await fastify.prisma.course.create({
          data: {
            ...safeData,
            price: safeData.price || 0,
            teacherId
          }
        });
        return reply.status(201).send(withFileUrls(course, ["thumbnailUrl"]));
      } catch (error) {
        if (error?.code === "P2002") {
          return reply.status(409).send({ error: "Slug kh\xF3a h\u1ECDc \u0111\xE3 t\u1ED3n t\u1EA1i" });
        }
        throw error;
      }
    }
  );
  fastify.put(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateCourseSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const existing = await fastify.prisma.course.findUnique({
        where: { id }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y kh\xF3a h\u1ECDc" });
      }
      if (data.slug) {
        const existingSlug = await fastify.prisma.course.findFirst({
          where: {
            slug: data.slug,
            id: { not: id }
          },
          select: { id: true }
        });
        if (existingSlug) {
          return reply.status(409).send({ error: "Slug kh\xF3a h\u1ECDc \u0111\xE3 t\u1ED3n t\u1EA1i" });
        }
      }
      let updateData = data;
      if (!data.slug && data.title && data.title !== existing.title) {
        updateData = {
          ...data,
          slug: await buildUniqueSlug(data.title, id)
        };
      }
      const { isLocked: _ignoredIsLocked, ...safeUpdateData } = updateData;
      try {
        const course = await fastify.prisma.course.update({
          where: { id },
          data: safeUpdateData
        });
        return withFileUrls(course, ["thumbnailUrl"]);
      } catch (error) {
        if (error?.code === "P2002") {
          return reply.status(409).send({ error: "Slug kh\xF3a h\u1ECDc \u0111\xE3 t\u1ED3n t\u1EA1i" });
        }
        throw error;
      }
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      const { password } = request.body || {};
      const actor = await fastify.prisma.user.findFirst({
        where: { userId: request.user.id }
      });
      if (!actor) {
        return reply.status(401).send({ error: "Kh\xF4ng th\u1EC3 x\xE1c th\u1EF1c ng\u01B0\u1EDDi d\xF9ng" });
      }
      const existing = await fastify.prisma.course.findUnique({
        where: { id },
        select: { id: true }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y kh\xF3a h\u1ECDc" });
      }
      const lockRows = await fastify.prisma.$queryRaw(Prisma.sql`SELECT is_locked FROM courses WHERE id = ${id} LIMIT 1`);
      const isLocked = Boolean(lockRows[0]?.is_locked);
      if (isLocked) {
        return reply.status(423).send({
          error: "Kh\xF3a h\u1ECDc \u0111ang b\u1ECB kh\xF3a. H\xE3y m\u1EDF kh\xF3a tr\u01B0\u1EDBc khi x\xF3a"
        });
      }
      const [enrollmentCount, submissionCount] = await Promise.all([
        fastify.prisma.enrollment.count({ where: { courseId: id } }),
        fastify.prisma.examSubmission.count({
          where: { exam: { courseId: id } }
        })
      ]);
      if (enrollmentCount > 0 || submissionCount > 0) {
        return reply.status(409).send({
          error: "Kh\xF4ng th\u1EC3 x\xF3a kh\xF3a h\u1ECDc khi v\u1EABn c\xF2n h\u1ECDc vi\xEAn ho\u1EB7c b\xE0i n\u1ED9p li\xEAn quan"
        });
      }
      await fastify.prisma.course.update({
        where: { id },
        data: {
          isActive: false,
          isPublished: false
        }
      });
      return { success: true, softDeleted: true };
    }
  );
};
var courses_routes_default = coursesRoutes;

// server/schemas/exam.schema.ts
import { z as z5 } from "zod";
var createExamSchema = z5.object({
  courseId: z5.string(),
  title: z5.string().min(1, "Ti\xEAu \u0111\u1EC1 l\xE0 b\u1EAFt bu\u1ED9c"),
  description: z5.string().optional(),
  week: z5.number().int().min(1, "Tu\u1EA7n ph\u1EA3i \xEDt nh\u1EA5t l\xE0 1").default(1),
  durationMinutes: z5.number().int().min(1, "Th\u1EDDi gian thi ph\u1EA3i \xEDt nh\u1EA5t l\xE0 1 ph\xFAt").default(60),
  examType: z5.string().default("ielts"),
  isPublished: z5.boolean().optional().default(false),
  isActive: z5.boolean().optional().default(true),
  isLocked: z5.boolean().optional().default(false),
  isOpen: z5.boolean().optional().default(false),
  maxParticipants: z5.number().int().positive().optional().nullable()
});
var updateExamSchema = createExamSchema.partial();

// server/services/authorization.service.ts
import { basename, resolve, sep } from "path";
var AuthorizationError = class extends Error {
  statusCode;
  constructor(message, statusCode = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
};
var NotFoundError = class extends Error {
  statusCode;
  constructor(message = "T\xE0i nguy\xEAn kh\xF4ng t\u1ED3n t\u1EA1i") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
};
var AuthorizationService = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Xác thực quyền quản trị hoặc giáo viên phụ trách chính lớp học.
   * Throws 404 nếu lớp không tồn tại, 403 nếu không có quyền.
   */
  async requireClassTeacherOrAdmin(params) {
    const { userId, userRoles = [], classId } = params;
    const isAdmin = userRoles.includes("admin");
    const cls = await this.prisma.class.findUnique({
      where: { id: classId }
    });
    if (!cls) {
      throw new NotFoundError("L\u1EDBp h\u1ECDc kh\xF4ng t\u1ED3n t\u1EA1i.");
    }
    if (isAdmin) {
      return cls;
    }
    const isTeacher = userRoles.includes("teacher");
    if (isTeacher && cls.teacherId === userId) {
      return cls;
    }
    throw new AuthorizationError(
      "T\u1EEB ch\u1ED1i truy c\u1EADp: B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n thao t\xE1c tr\xEAn l\u1EDBp h\u1ECDc n\xE0y.",
      403
    );
  }
  /**
   * Kiểm tra xem học viên có đang trong lớp học (active) hay không.
   */
  async isStudentEnrolledInClass(studentId, classId) {
    const record = await this.prisma.classStudent.findFirst({
      where: {
        classId,
        studentId
      }
    });
    return !!record;
  }
  /**
   * Kiểm tra quyền làm/xem bài thi của học viên (hỗ trợ cả Direct Enrollment và Class Membership).
   */
  async isStudentAuthorizedForExam(params) {
    const { studentId, examId, courseId, isOpen } = params;
    if (isOpen) return true;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId
        }
      }
    });
    if (enrollment) return true;
    const classStudent = await this.prisma.classStudent.findFirst({
      where: {
        studentId,
        class: {
          isActive: true,
          OR: [
            { courseId },
            { homeworks: { some: { examId } } }
          ]
        }
      }
    });
    return !!classStudent;
  }
  /**
   * Chuẩn hóa và kiểm tra ranh giới thư mục tuyệt đối chống Path Traversal.
   */
  validateUploadPathBoundary(params) {
    const { subDir, rawFileName, baseUploadDir } = params;
    if (subDir !== "images" && subDir !== "audio") {
      throw new AuthorizationError("Th\u01B0 m\u1EE5c con kh\xF4ng h\u1EE3p l\u1EC7", 400);
    }
    const safeFileName = basename(rawFileName.trim());
    if (!safeFileName || safeFileName === "." || safeFileName === "..") {
      throw new AuthorizationError("T\xEAn t\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7", 400);
    }
    const targetBaseDir = resolve(baseUploadDir, subDir);
    const targetFilePath = resolve(targetBaseDir, safeFileName);
    if (!targetFilePath.startsWith(targetBaseDir + sep)) {
      throw new AuthorizationError("Ph\xE1t hi\u1EC7n h\xE0nh vi \u0111i\u1EC1u h\u01B0\u1EDBng \u0111\u01B0\u1EDDng d\u1EABn kh\xF4ng h\u1EE3p l\u1EC7 (Path Traversal)", 403);
    }
    return targetFilePath;
  }
  /**
   * Authoring IDOR Protection: Xác thực quyền soạn thảo Đề thi (Admin hoặc Giáo viên phụ trách Khóa học).
   */
  async requireExamAuthoringAccess(examId, userId, userRoles = []) {
    if (userRoles.includes("admin")) return true;
    if (!userRoles.includes("teacher")) {
      throw new AuthorizationError("Ch\u1EC9 gi\xE1o vi\xEAn ho\u1EB7c admin c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa", 403);
    }
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: { select: { teacherId: true } } }
    });
    if (!exam) {
      throw new NotFoundError("B\xE0i thi kh\xF4ng t\u1ED3n t\u1EA1i.");
    }
    if (exam.course?.teacherId && exam.course.teacherId !== userId) {
      throw new AuthorizationError(
        "T\u1EEB ch\u1ED1i quy\u1EC1n: B\u1EA1n kh\xF4ng ph\u1EE5 tr\xE1ch kh\xF3a h\u1ECDc ch\u1EE9a \u0111\u1EC1 thi n\xE0y.",
        403
      );
    }
    return exam;
  }
  /**
   * Authoring IDOR Protection: Xác thực quyền soạn thảo Phần thi (Section).
   */
  async requireSectionAuthoringAccess(sectionId, userId, userRoles = []) {
    if (userRoles.includes("admin")) return true;
    if (!userRoles.includes("teacher")) {
      throw new AuthorizationError("Ch\u1EC9 gi\xE1o vi\xEAn ho\u1EB7c admin c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa", 403);
    }
    const section = await this.prisma.examSection.findUnique({
      where: { id: sectionId },
      include: { exam: { include: { course: { select: { teacherId: true } } } } }
    });
    if (!section) {
      throw new NotFoundError("Ph\u1EA7n thi kh\xF4ng t\u1ED3n t\u1EA1i.");
    }
    const teacherId = section.exam?.course?.teacherId;
    if (teacherId && teacherId !== userId) {
      throw new AuthorizationError(
        "T\u1EEB ch\u1ED1i quy\u1EC1n: B\u1EA1n kh\xF4ng ph\u1EE5 tr\xE1ch kh\xF3a h\u1ECDc ch\u1EE9a ph\u1EA7n thi n\xE0y.",
        403
      );
    }
    return section;
  }
  /**
   * Authoring IDOR Protection: Xác thực quyền soạn thảo Nhóm câu hỏi (QuestionGroup).
   */
  async requireQuestionGroupAuthoringAccess(groupId, userId, userRoles = []) {
    if (userRoles.includes("admin")) return true;
    if (!userRoles.includes("teacher")) {
      throw new AuthorizationError("Ch\u1EC9 gi\xE1o vi\xEAn ho\u1EB7c admin c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa", 403);
    }
    const group = await this.prisma.questionGroup.findUnique({
      where: { id: groupId },
      include: {
        section: {
          include: { exam: { include: { course: { select: { teacherId: true } } } } }
        }
      }
    });
    if (!group) {
      throw new NotFoundError("Nh\xF3m c\xE2u h\u1ECFi kh\xF4ng t\u1ED3n t\u1EA1i.");
    }
    const teacherId = group.section?.exam?.course?.teacherId;
    if (teacherId && teacherId !== userId) {
      throw new AuthorizationError(
        "T\u1EEB ch\u1ED1i quy\u1EC1n: B\u1EA1n kh\xF4ng ph\u1EE5 tr\xE1ch kh\xF3a h\u1ECDc ch\u1EE9a nh\xF3m c\xE2u h\u1ECFi n\xE0y.",
        403
      );
    }
    return group;
  }
  /**
   * Authoring IDOR Protection: Xác thực quyền soạn thảo Câu hỏi (Question).
   */
  async requireQuestionAuthoringAccess(questionId, userId, userRoles = []) {
    if (userRoles.includes("admin")) return true;
    if (!userRoles.includes("teacher")) {
      throw new AuthorizationError("Ch\u1EC9 gi\xE1o vi\xEAn ho\u1EB7c admin c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa", 403);
    }
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        group: {
          include: {
            section: {
              include: { exam: { include: { course: { select: { teacherId: true } } } } }
            }
          }
        }
      }
    });
    if (!question) {
      throw new NotFoundError("C\xE2u h\u1ECFi kh\xF4ng t\u1ED3n t\u1EA1i.");
    }
    const teacherId = question.group?.section?.exam?.course?.teacherId;
    if (teacherId && teacherId !== userId) {
      throw new AuthorizationError(
        "T\u1EEB ch\u1ED1i quy\u1EC1n: B\u1EA1n kh\xF4ng ph\u1EE5 tr\xE1ch kh\xF3a h\u1ECDc ch\u1EE9a c\xE2u h\u1ECFi n\xE0y.",
        403
      );
    }
    return question;
  }
};

// server/routes/exams.routes.ts
var examsRoutes = async (fastify) => {
  const cleanQuestionData = (q, isAdminOrTeacher) => {
    let selectionMode = "single";
    let maxSelections = 1;
    if (q.questionType === "multiple_choice") {
      if (q.correctAnswer && typeof q.correctAnswer === "string") {
        const answers = q.correctAnswer.split("|").map((s) => s.trim()).filter(Boolean);
        if (answers.length > 1) {
          selectionMode = "multiple";
          maxSelections = answers.length;
        }
      }
    }
    if (isAdminOrTeacher) {
      return {
        ...q,
        selectionMode,
        maxSelections,
        isMultiChoice: selectionMode === "multiple"
      };
    }
    const cleaned = { ...q };
    if (q.questionType === "matching" && q.correctAnswer) {
      try {
        const config = JSON.parse(q.correctAnswer);
        delete config.pairs;
        if (!cleaned.options || typeof cleaned.options !== "object") {
          cleaned.options = { items: config.items || [], options: config.options || [] };
        }
      } catch {
      }
    }
    delete cleaned.correctAnswer;
    delete cleaned.correct_answer;
    delete cleaned.audioScript;
    delete cleaned.audio_script;
    delete cleaned.acceptedAnswers;
    delete cleaned.answerKey;
    delete cleaned.answer_key;
    cleaned.correctAnswer = null;
    cleaned.audioScript = null;
    cleaned.selectionMode = selectionMode;
    cleaned.maxSelections = maxSelections;
    cleaned.isMultiChoice = selectionMode === "multiple";
    return cleaned;
  };
  fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
    const query = paginationSchema.safeParse(request.query);
    const { courseId, isPublished, isActive } = request.query;
    if (!query.success) {
      return reply.status(400).send({ error: "Tham s\u1ED1 truy v\u1EA5n kh\xF4ng h\u1EE3p l\u1EC7" });
    }
    const { page, limit, search, sortBy = "createdAt", sortOrder } = query.data;
    const skip = (page - 1) * limit;
    const where = {};
    const user = request.user;
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (isTeacher && !isAdmin) {
      where.course = { teacherId: user.id };
    } else if (!isAdmin && !isTeacher) {
      where.OR = [
        {
          course: {
            enrollments: { some: { studentId: user.id } }
          }
        },
        { isOpen: true }
      ];
      where.isPublished = true;
      where.isActive = true;
    }
    if (courseId) {
      where.courseId = courseId;
    }
    if (isPublished !== void 0) {
      where.isPublished = isPublished === "true";
    }
    if (isActive !== void 0) {
      where.isActive = isActive === "true";
    }
    if (search) {
      where.title = { contains: search };
    }
    const [data, total] = await Promise.all([
      fastify.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          course: {
            select: { id: true, title: true }
          },
          _count: {
            select: { sections: true, submissions: true }
          }
        }
      }),
      fastify.prisma.exam.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  });
  fastify.get(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const exam = await fastify.prisma.exam.findUnique({
        where: { id },
        include: {
          course: { select: { id: true, title: true } },
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questionGroups: {
                orderBy: { orderIndex: "asc" },
                include: {
                  questions: { orderBy: { orderIndex: "asc" } }
                }
              }
            }
          }
        }
      });
      if (!exam) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y b\xE0i thi" });
      }
      const user = request.user;
      const isAdmin = user.roles.includes("admin");
      const isTeacher = user.roles.includes("teacher");
      if (!isAdmin && !isTeacher) {
        const authService = new AuthorizationService(fastify.prisma);
        const isAuthorized = await authService.isStudentAuthorizedForExam({
          studentId: user.id,
          examId: exam.id,
          courseId: exam.courseId,
          isOpen: exam.isOpen
        });
        if (!isAuthorized) {
          return reply.status(403).send({ error: "B\u1EA1n ch\u01B0a \u0111\u0103ng k\xFD kh\xF3a h\u1ECDc ho\u1EB7c l\u1EDBp h\u1ECDc n\xE0y \u0111\u1EC3 xem b\xE0i thi" });
        }
        if (!exam.isPublished || !exam.isActive) {
          return reply.status(403).send({ error: "b\xE0i t\u1EADp hi\u1EC7n kh\xF4ng c\xF2n kh\u1EA3 d\u1EE5ng" });
        }
      }
      const shouldShowTranscript = isAdmin || isTeacher;
      const formattedSections = exam.sections.map((section) => ({
        ...section,
        audioUrl: toFileUrl(section.audioUrl),
        audioScript: shouldShowTranscript ? section.audioScript : void 0,
        questionGroups: section.questionGroups.map((group) => ({
          ...group,
          audioUrl: toFileUrl(group.audioUrl),
          questions: group.questions.map((question) => {
            const formatted = {
              ...question,
              audioUrl: toFileUrl(question.audioUrl)
            };
            return cleanQuestionData(formatted, isAdmin || isTeacher);
          })
        }))
      }));
      return {
        ...exam,
        sections: formattedSections
      };
    }
  );
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const data = handleValidation(
        createExamSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const { isLocked: _ignoredIsLocked, ...safeData } = data;
      const exam = await fastify.prisma.exam.create({
        data: safeData
      });
      const defaultSections = [
        {
          sectionType: "listening",
          title: "Listening",
          orderIndex: 0
        },
        { sectionType: "reading", title: "Reading", orderIndex: 1 },
        { sectionType: "writing", title: "Writing", orderIndex: 2 },
        { sectionType: "speaking", title: "Speaking", orderIndex: 3 },
        { sectionType: "general", title: "Grammar", orderIndex: 4 }
      ];
      await fastify.prisma.examSection.createMany({
        data: defaultSections.map((s) => ({
          examId: exam.id,
          ...s
        }))
      });
      const examWithSections = await fastify.prisma.exam.findUnique({
        where: { id: exam.id },
        include: {
          sections: { orderBy: { orderIndex: "asc" } }
        }
      });
      return reply.status(201).send(examWithSections);
    }
  );
  fastify.put(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateExamSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const { isLocked: _ignoredIsLocked, ...safeData } = data;
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireExamAuthoringAccess(
          id,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      const existing = await fastify.prisma.exam.findUnique({
        where: { id },
        select: { id: true, isActive: true, isLocked: true }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y b\xE0i thi" });
      }
      if (existing.isActive === false || existing.isLocked === true) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt th\xF4ng tin."
        });
      }
      const updatedExam = await fastify.prisma.exam.update({
        where: { id },
        data: safeData
      });
      return updatedExam;
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      const { password } = request.body || {};
      const actor = await fastify.prisma.user.findFirst({
        where: { userId: request.user.id }
      });
      if (!actor) {
        return reply.status(401).send({ error: "Kh\xF4ng th\u1EC3 x\xE1c th\u1EF1c ng\u01B0\u1EDDi d\xF9ng" });
      }
      const existing = await fastify.prisma.exam.findUnique({
        where: { id },
        select: { id: true, isActive: true, isLocked: true }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y b\xE0i thi" });
      }
      if (existing.isActive === false) {
        return reply.status(409).send({
          success: false,
          action: "already_archived",
          errorCode: "EXAM_ALREADY_ARCHIVED",
          message: "\u0110\u1EC1 thi n\xE0y \u0111\xE3 \u1EDF trong kho l\u01B0u tr\u1EEF (Archived)."
        });
      }
      const submissionCount = await fastify.prisma.examSubmission.count({
        where: { examId: id }
      });
      if (submissionCount > 0) {
        await fastify.prisma.$transaction(async (tx) => {
          await tx.exam.update({
            where: { id },
            data: {
              isPublished: false,
              isActive: false,
              isOpen: false,
              isLocked: true
            }
          });
        });
        return reply.status(409).send({
          success: false,
          action: "archived",
          errorCode: "CANNOT_HARD_DELETE_EXAM_WITH_SUBMISSIONS",
          message: "\u0110\u1EC1 thi \u0111\xE3 c\xF3 b\xE0i l\xE0m c\u1EE7a h\u1ECDc vi\xEAn. H\u1EC7 th\u1ED1ng \u0111\xE3 t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n sang ch\u1EBF \u0111\u1ED9 L\u01B0u tr\u1EEF (Archived) \u0111\u1EC3 b\u1EA3o to\xE0n 100% l\u1ECBch s\u1EED.",
          submissionCount
        });
      }
      await fastify.prisma.exam.delete({ where: { id } });
      return {
        success: true,
        action: "hard_deleted",
        message: "\u0110\xE3 x\xF3a b\xE0i thi ch\u01B0a s\u1EED d\u1EE5ng th\xE0nh c\xF4ng"
      };
    }
  );
};
var exams_routes_default = examsRoutes;

// server/routes/sections.routes.ts
import { z as z6 } from "zod";
var sectionTypeEnum = z6.enum(
  ["listening", "reading", "writing", "speaking", "general"],
  {
    errorMap: () => ({
      message: "Lo\u1EA1i ph\u1EA7n thi kh\xF4ng h\u1EE3p l\u1EC7. Ph\u1EA3i l\xE0: listening, reading, writing, speaking, general"
    })
  }
);
var createSectionSchema = z6.object({
  examId: z6.string({ required_error: "ID b\xE0i t\u1EADp l\xE0 b\u1EAFt bu\u1ED9c" }),
  sectionType: sectionTypeEnum,
  title: z6.string().min(1, "Ti\xEAu \u0111\u1EC1 l\xE0 b\u1EAFt bu\u1ED9c"),
  instructions: z6.string().max(5e6, "N\u1ED9i dung h\u01B0\u1EDBng d\u1EABn qu\xE1 d\xE0i").optional(),
  content: z6.any().optional(),
  audioUrl: z6.string().optional(),
  audioScript: z6.string().max(5e6, "N\u1ED9i dung script qu\xE1 d\xE0i").optional(),
  durationMinutes: z6.number({ invalid_type_error: "Th\u1EDDi gian ph\u1EA3i l\xE0 s\u1ED1" }).int().optional(),
  orderIndex: z6.number().int().default(0)
});
var updateSectionSchema = z6.object({
  title: z6.string().min(1, "Ti\xEAu \u0111\u1EC1 l\xE0 b\u1EAFt bu\u1ED9c").optional(),
  instructions: z6.string().max(5e6, "N\u1ED9i dung h\u01B0\u1EDBng d\u1EABn qu\xE1 d\xE0i").optional(),
  content: z6.any().optional(),
  audioUrl: z6.string().optional(),
  audioScript: z6.string().max(5e6, "N\u1ED9i dung script qu\xE1 d\xE0i").optional(),
  durationMinutes: z6.number({ invalid_type_error: "Th\u1EDDi gian ph\u1EA3i l\xE0 s\u1ED1" }).int().optional(),
  orderIndex: z6.number().int().optional()
});
var sectionsRoutes = async (fastify) => {
  const cleanQuestionData = (q, isAdminOrTeacher) => {
    if (isAdminOrTeacher) return q;
    const cleaned = { ...q };
    if (q.questionType === "matching" && q.correctAnswer) {
      try {
        const config = JSON.parse(q.correctAnswer);
        delete config.pairs;
        cleaned.correctAnswer = JSON.stringify(config);
      } catch {
        cleaned.correctAnswer = null;
      }
    } else {
      cleaned.correctAnswer = null;
    }
    return cleaned;
  };
  fastify.get(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const section = await fastify.prisma.examSection.findUnique({
        where: { id },
        include: {
          exam: { select: { id: true, courseId: true, isPublished: true, isActive: true, isOpen: true } },
          questionGroups: {
            orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
            include: {
              questions: {
                orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }]
              }
            }
          }
        }
      });
      if (!section) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y Section" });
      }
      const user = request.user;
      const isAdmin = user.roles.includes("admin");
      const isTeacher = user.roles.includes("teacher");
      if (!isAdmin && !isTeacher) {
        const authService = new AuthorizationService(fastify.prisma);
        const isAuthorized = await authService.isStudentAuthorizedForExam({
          studentId: user.id,
          examId: section.exam.id,
          courseId: section.exam.courseId,
          isOpen: section.exam.isOpen
        });
        if (!isAuthorized) {
          return reply.status(403).send({ error: "B\u1EA1n ch\u01B0a \u0111\u0103ng k\xFD kh\xF3a h\u1ECDc ho\u1EB7c l\u1EDBp h\u1ECDc n\xE0y" });
        }
      }
      const isAdminOrTeacher = isAdmin || isTeacher;
      const formatted = {
        ...section,
        audioUrl: toFileUrl(section.audioUrl),
        audioScript: isAdminOrTeacher ? section.audioScript : void 0,
        questionGroups: section.questionGroups.map((group) => ({
          ...group,
          audioUrl: toFileUrl(group.audioUrl),
          questions: group.questions.map((q) => {
            const fq = {
              ...q,
              audioUrl: toFileUrl(q.audioUrl)
            };
            return cleanQuestionData(fq, isAdminOrTeacher);
          })
        }))
      };
      return formatted;
    }
  );
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return reply.status(403).send({
        error: "Kh\xF4ng th\u1EC3 t\u1EA1o section th\u1EE7 c\xF4ng. Sections \u0111\u01B0\u1EE3c t\u1EA1o t\u1EF1 \u0111\u1ED9ng khi t\u1EA1o b\xE0i thi."
      });
    }
  );
  fastify.put(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateSectionSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireSectionAuthoringAccess(
          id,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      const existing = await fastify.prisma.examSection.findUnique({
        where: { id },
        include: { exam: { select: { isActive: true, isLocked: true } } }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y ph\u1EA7n thi" });
      }
      if (existing.exam && (existing.exam.isActive === false || existing.exam.isLocked === true)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt ph\u1EA7n thi."
        });
      }
      try {
        const section = await fastify.prisma.examSection.update({
          where: { id },
          data
        });
        return withFileUrls(section, ["audioUrl"]);
      } catch (error) {
        if (error?.code === "P2000") {
          return reply.status(400).send({
            error: "N\u1ED9i dung qu\xE1 d\xE0i cho tr\u01B0\u1EDDng l\u01B0u tr\u1EEF"
          });
        }
        throw error;
      }
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      return reply.status(403).send({
        error: "Kh\xF4ng th\u1EC3 x\xF3a section. M\u1ED7i b\xE0i t\u1EADp lu\xF4n c\xF3 \u0111\u1EE7 5 sections."
      });
    }
  );
};
var sections_routes_default = sectionsRoutes;

// server/routes/questions.routes.ts
import { z as z7 } from "zod";

// server/utils/questionNormalizer.ts
function sanitizeBackendQuestionPayload(input) {
  const type = input.questionType || "short_answer";
  const text = (input.questionText || "").trim();
  const points = typeof input.points === "number" ? input.points : 1;
  const orderIndex = typeof input.orderIndex === "number" ? input.orderIndex : 0;
  const audioUrl = input.audioUrl || null;
  const groupId = input.groupId;
  let sanitizedOptions = null;
  let sanitizedCorrectAnswer = typeof input.correctAnswer === "string" ? input.correctAnswer.trim() : null;
  switch (type) {
    case "multiple_choice": {
      let rawOpts = input.options;
      if (typeof rawOpts === "string") {
        try {
          rawOpts = JSON.parse(rawOpts);
        } catch {
          rawOpts = null;
        }
      }
      if (Array.isArray(rawOpts)) {
        const cleaned = rawOpts.map((o) => typeof o === "string" ? o.trim() : "").filter(Boolean);
        sanitizedOptions = cleaned.length > 0 ? cleaned : null;
      }
      break;
    }
    case "short_answer":
    case "essay":
    case "speaking":
    case "fill_blank": {
      sanitizedOptions = null;
      break;
    }
    case "matching": {
      sanitizedOptions = null;
      break;
    }
    case "true_false_not_given":
    case "yes_no_not_given": {
      sanitizedOptions = null;
      if (sanitizedCorrectAnswer) {
        sanitizedCorrectAnswer = sanitizedCorrectAnswer.toUpperCase();
      }
      break;
    }
    default:
      sanitizedOptions = null;
  }
  return {
    groupId,
    questionType: type,
    questionText: text,
    options: sanitizedOptions,
    correctAnswer: sanitizedCorrectAnswer,
    points,
    orderIndex,
    audioUrl
  };
}

// server/routes/questions.routes.ts
var questionTypeEnum = z7.enum(
  [
    "multiple_choice",
    "fill_blank",
    "matching",
    "essay",
    "speaking",
    "listening",
    "short_answer",
    "true_false_not_given",
    "yes_no_not_given"
  ],
  {
    errorMap: () => ({
      message: "Lo\u1EA1i c\xE2u h\u1ECFi kh\xF4ng h\u1EE3p l\u1EC7"
    })
  }
);
var createQuestionGroupSchema = z7.object({
  sectionId: z7.string({ required_error: "ID ph\u1EA7n thi l\xE0 b\u1EAFt bu\u1ED9c" }),
  title: z7.string().optional(),
  instructions: z7.string().optional(),
  passage: z7.string().optional(),
  audioUrl: z7.string().optional(),
  orderIndex: z7.number().int().default(0)
});
var validateQuestionSemantic = (data, ctx) => {
  const type = data.questionType;
  if (!type) return;
  if (type === "multiple_choice") {
    let opts = data.options;
    if (typeof opts === "string") {
      try {
        opts = JSON.parse(opts);
      } catch {
        opts = null;
      }
    }
    const validOptions = Array.isArray(opts) ? opts.filter((o) => typeof o === "string" && o.trim().length > 0) : [];
    if (validOptions.length < 2) {
      ctx.addIssue({
        code: z7.ZodIssueCode.custom,
        message: "C\xE2u h\u1ECFi tr\u1EAFc nghi\u1EC7m ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 l\u1EF1a ch\u1ECDn c\xF3 n\u1ED9i dung",
        path: ["options"]
      });
    }
  }
  if (type === "matching" && data.correctAnswer) {
    try {
      const parsed = JSON.parse(data.correctAnswer);
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0 || !Array.isArray(parsed.options) || parsed.options.length === 0 || typeof parsed.pairs !== "object" || parsed.pairs === null || Object.keys(parsed.pairs).length === 0) {
        ctx.addIssue({
          code: z7.ZodIssueCode.custom,
          message: "D\u1EEF li\u1EC7u n\u1ED1i \u0111\xE1p \xE1n (matching) kh\xF4ng \u0111\xFAng c\u1EA5u tr\xFAc (items, options, pairs)",
          path: ["correctAnswer"]
        });
      }
    } catch {
      ctx.addIssue({
        code: z7.ZodIssueCode.custom,
        message: "\u0110\xE1p \xE1n matching ph\u1EA3i l\xE0 chu\u1ED7i JSON h\u1EE3p l\u1EC7",
        path: ["correctAnswer"]
      });
    }
  }
  if (type === "true_false_not_given" && data.correctAnswer) {
    const val = data.correctAnswer.trim().toUpperCase();
    if (!["TRUE", "FALSE", "NOT GIVEN"].includes(val)) {
      ctx.addIssue({
        code: z7.ZodIssueCode.custom,
        message: "\u0110\xE1p \xE1n TRUE/FALSE/NOT GIVEN ph\u1EA3i l\xE0 TRUE, FALSE ho\u1EB7c NOT GIVEN",
        path: ["correctAnswer"]
      });
    }
  }
  if (type === "yes_no_not_given" && data.correctAnswer) {
    const val = data.correctAnswer.trim().toUpperCase();
    if (!["YES", "NO", "NOT GIVEN"].includes(val)) {
      ctx.addIssue({
        code: z7.ZodIssueCode.custom,
        message: "\u0110\xE1p \xE1n YES/NO/NOT GIVEN ph\u1EA3i l\xE0 YES, NO ho\u1EB7c NOT GIVEN",
        path: ["correctAnswer"]
      });
    }
  }
};
var baseQuestionSchema = z7.object({
  groupId: z7.string({ required_error: "ID nh\xF3m c\xE2u h\u1ECFi l\xE0 b\u1EAFt bu\u1ED9c" }),
  questionType: questionTypeEnum,
  questionText: z7.string().min(1, "N\u1ED9i dung c\xE2u h\u1ECFi l\xE0 b\u1EAFt bu\u1ED9c"),
  options: z7.any().optional(),
  correctAnswer: z7.string().optional(),
  audioUrl: z7.string().optional(),
  points: z7.number({ invalid_type_error: "\u0110i\u1EC3m ph\u1EA3i l\xE0 s\u1ED1" }).int().default(1),
  orderIndex: z7.number().int().default(0)
});
var createQuestionSchema = baseQuestionSchema.superRefine(validateQuestionSemantic);
var updateQuestionGroupSchema = createQuestionGroupSchema.partial();
var updateQuestionSchema = baseQuestionSchema.partial().superRefine((data, ctx) => {
  if (data.questionType) {
    validateQuestionSemantic(data, ctx);
  }
});
var questionsRoutes = async (fastify) => {
  const MAX_AUTO_ORDER_RETRIES = 5;
  const isPrismaErrorCode = (error, code) => typeof error === "object" && error !== null && "code" in error && error.code === code;
  const createQuestionWithAutoOrder = async (data) => {
    let attempt = 0;
    let lastError;
    while (attempt < MAX_AUTO_ORDER_RETRIES) {
      try {
        return await fastify.prisma.$transaction(
          async (tx) => {
            const maxOrder = await tx.question.aggregate({
              where: { groupId: data.groupId },
              _max: { orderIndex: true }
            });
            const nextOrderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
            return tx.question.create({
              data: {
                ...data,
                orderIndex: nextOrderIndex
              }
            });
          },
          { isolationLevel: "Serializable" }
        );
      } catch (error) {
        lastError = error;
        const shouldRetry = isPrismaErrorCode(error, "P2002") || isPrismaErrorCode(error, "P2034");
        if (!shouldRetry) {
          throw error;
        }
        attempt += 1;
      }
    }
    throw lastError;
  };
  const hasOrderConflict = async (groupId, orderIndex, excludeId) => {
    const existing = await fastify.prisma.question.findFirst({
      where: {
        groupId,
        orderIndex,
        ...excludeId ? { id: { not: excludeId } } : {}
      },
      select: { id: true }
    });
    return !!existing;
  };
  const isExamArchivedBySectionId = async (sectionId) => {
    const section = await fastify.prisma.examSection.findUnique({
      where: { id: sectionId },
      include: { exam: { select: { isActive: true, isLocked: true } } }
    });
    const exam = section?.exam;
    return Boolean(exam && (exam.isActive === false || exam.isLocked === true));
  };
  const isExamArchivedByGroupId = async (groupId) => {
    const group = await fastify.prisma.questionGroup.findUnique({
      where: { id: groupId },
      include: { section: { include: { exam: { select: { isActive: true, isLocked: true } } } } }
    });
    const exam = group?.section?.exam;
    return Boolean(exam && (exam.isActive === false || exam.isLocked === true));
  };
  const isExamArchivedByQuestionId = async (questionId) => {
    const question = await fastify.prisma.question.findUnique({
      where: { id: questionId },
      include: { group: { include: { section: { include: { exam: { select: { isActive: true, isLocked: true } } } } } } }
    });
    const exam = question?.group?.section?.exam;
    return Boolean(exam && (exam.isActive === false || exam.isLocked === true));
  };
  fastify.post(
    "/groups",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const data = handleValidation(
        createQuestionGroupSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireSectionAuthoringAccess(
          data.sectionId,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      if (await isExamArchivedBySectionId(data.sectionId)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 t\u1EA1o nh\xF3m c\xE2u h\u1ECFi m\u1EDBi."
        });
      }
      const group = await fastify.prisma.questionGroup.create({
        data
      });
      return reply.status(201).send(group);
    }
  );
  fastify.put(
    "/groups/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateQuestionGroupSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireQuestionGroupAuthoringAccess(
          id,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      if (await isExamArchivedByGroupId(id)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 ch\u1EC9nh s\u1EEDa nh\xF3m c\xE2u h\u1ECFi."
        });
      }
      const group = await fastify.prisma.questionGroup.update({
        where: { id },
        data
      });
      return group;
    }
  );
  fastify.delete(
    "/groups/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      if (await isExamArchivedByGroupId(id)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 x\xF3a nh\xF3m c\xE2u h\u1ECFi."
        });
      }
      await fastify.prisma.questionGroup.delete({ where: { id } });
      return { success: true };
    }
  );
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const data = handleValidation(
        createQuestionSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireQuestionGroupAuthoringAccess(
          data.groupId,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      if (await isExamArchivedByGroupId(data.groupId)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 th\xEAm c\xE2u h\u1ECFi m\u1EDBi."
        });
      }
      const body = request.body;
      const orderIndexProvided = body && (Object.prototype.hasOwnProperty.call(body, "orderIndex") || Object.prototype.hasOwnProperty.call(body, "order_index"));
      const sanitized = sanitizeBackendQuestionPayload(data);
      if (!orderIndexProvided) {
        try {
          const question = await createQuestionWithAutoOrder(sanitized);
          return reply.status(201).send(question);
        } catch (error) {
          if (isPrismaErrorCode(error, "P2002")) {
            return reply.status(409).send({
              error: "Th\u1EE9 t\u1EF1 c\xE2u h\u1ECFi b\u1ECB tr\xF9ng trong c\xF9ng nh\xF3m"
            });
          }
          throw error;
        }
      }
      const desiredOrder = data.orderIndex;
      if (await hasOrderConflict(data.groupId, desiredOrder)) {
        try {
          const question = await createQuestionWithAutoOrder(sanitized);
          return reply.status(201).send(question);
        } catch (error) {
          if (isPrismaErrorCode(error, "P2002")) {
            return reply.status(409).send({
              error: "Th\u1EE9 t\u1EF1 c\xE2u h\u1ECFi b\u1ECB tr\xF9ng trong c\xF9ng nh\xF3m"
            });
          }
          throw error;
        }
      }
      sanitized.orderIndex = desiredOrder;
      try {
        const question = await fastify.prisma.question.create({
          data: sanitized
        });
        return reply.status(201).send(question);
      } catch (error) {
        if (isPrismaErrorCode(error, "P2002")) {
          const question = await createQuestionWithAutoOrder(sanitized);
          return reply.status(201).send(question);
        }
        throw error;
      }
    }
  );
  fastify.put(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const data = handleValidation(
        updateQuestionSchema.safeParse(request.body),
        request,
        reply
      );
      if (!data) return;
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireQuestionAuthoringAccess(
          id,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      if (await isExamArchivedByQuestionId(id)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 ch\u1EC9nh s\u1EEDa c\xE2u h\u1ECFi."
        });
      }
      const body = request.body;
      const orderIndexProvided = body && (Object.prototype.hasOwnProperty.call(body, "orderIndex") || Object.prototype.hasOwnProperty.call(body, "order_index"));
      if (!orderIndexProvided) {
        delete data.orderIndex;
      }
      const existing = await fastify.prisma.question.findUnique({
        where: { id },
        select: { id: true, groupId: true, orderIndex: true, questionType: true }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y c\xE2u h\u1ECFi" });
      }
      const nextGroupId = data.groupId ?? existing.groupId;
      const nextOrderIndex = data.orderIndex !== void 0 && data.orderIndex !== null ? data.orderIndex : existing.orderIndex ?? 0;
      const groupChanged = nextGroupId !== existing.groupId;
      const orderChanged = nextOrderIndex !== (existing.orderIndex ?? 0);
      const shouldValidateOrderConflict = groupChanged || orderChanged;
      if (shouldValidateOrderConflict) {
        if (await hasOrderConflict(nextGroupId, nextOrderIndex, id)) {
          return reply.status(409).send({
            error: "Th\u1EE9 t\u1EF1 c\xE2u h\u1ECFi b\u1ECB tr\xF9ng trong c\xF9ng nh\xF3m"
          });
        }
      }
      const merged = {
        ...existing,
        ...data,
        groupId: nextGroupId,
        orderIndex: nextOrderIndex
      };
      const sanitized = sanitizeBackendQuestionPayload(merged);
      const question = await fastify.prisma.question.update({
        where: { id },
        data: {
          ...sanitized,
          options: sanitized.options ? sanitized.options : void 0
        }
      });
      return question;
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      if (await isExamArchivedByQuestionId(id)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 x\xF3a c\xE2u h\u1ECFi."
        });
      }
      await fastify.prisma.question.delete({ where: { id } });
      return { success: true };
    }
  );
  fastify.post(
    "/bulk",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { questions, groupId } = request.body;
      if (!Array.isArray(questions) || !groupId) {
        return reply.status(400).send({ error: "Y\xEAu c\u1EA7u m\u1EA3ng questions v\xE0 groupId" });
      }
      const authService = new AuthorizationService(fastify.prisma);
      try {
        await authService.requireQuestionGroupAuthoringAccess(
          groupId,
          request.user.id,
          request.user.roles
        );
      } catch (err) {
        if (err.statusCode) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
      if (await isExamArchivedByGroupId(groupId)) {
        return reply.status(409).send({
          error: "EXAM_ARCHIVED_IMMUTABLE",
          message: "\u0110\u1EC1 thi \u0111\xE3 l\u01B0u tr\u1EEF ho\u1EB7c b\u1ECB kh\xF3a, kh\xF4ng th\u1EC3 th\xEAm c\xE2u h\u1ECFi h\xE0ng lo\u1EA1t."
        });
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || !String(q.questionText).trim()) {
          return reply.status(400).send({
            error: `C\xE2u h\u1ECFi s\u1ED1 ${i + 1} kh\xF4ng c\xF3 n\u1ED9i dung`
          });
        }
        if (q.questionType === "multiple_choice") {
          let opts = q.options;
          if (typeof opts === "string") {
            try {
              opts = JSON.parse(opts);
            } catch {
              opts = null;
            }
          }
          const validOptions = Array.isArray(opts) ? opts.filter((o) => typeof o === "string" && o.trim().length > 0) : [];
          if (validOptions.length < 2) {
            return reply.status(400).send({
              error: `C\xE2u h\u1ECFi s\u1ED1 ${i + 1} (Tr\u1EAFc nghi\u1EC7m) ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 l\u1EF1a ch\u1ECDn c\xF3 n\u1ED9i dung`
            });
          }
        }
      }
      let attempt = 0;
      let lastError;
      while (attempt < MAX_AUTO_ORDER_RETRIES) {
        try {
          const created = await fastify.prisma.$transaction(
            async (tx) => {
              const existingOrders = await tx.question.findMany({
                where: { groupId },
                select: { orderIndex: true }
              });
              const usedOrders = /* @__PURE__ */ new Set();
              existingOrders.forEach((item) => {
                if (typeof item.orderIndex === "number") {
                  usedOrders.add(item.orderIndex);
                }
              });
              const maxExisting = usedOrders.size > 0 ? Math.max(...Array.from(usedOrders)) : -1;
              let nextOrder = maxExisting + 1;
              const batchOrders = /* @__PURE__ */ new Set();
              const payload = questions.map((q) => {
                const rawOrder = q.orderIndex !== void 0 && q.orderIndex !== null ? q.orderIndex : null;
                const orderIndex = rawOrder !== null ? rawOrder : nextOrder++;
                if (usedOrders.has(orderIndex) || batchOrders.has(orderIndex)) {
                  throw new Error("DUPLICATE_ORDER_INDEX");
                }
                batchOrders.add(orderIndex);
                const sanitized = sanitizeBackendQuestionPayload({
                  ...q,
                  groupId,
                  orderIndex
                });
                return {
                  ...sanitized,
                  options: sanitized.options ? sanitized.options : void 0
                };
              });
              const result = await tx.question.createMany({
                data: payload
              });
              return result.count;
            },
            { isolationLevel: "Serializable" }
          );
          return { created };
        } catch (error) {
          lastError = error;
          if (error?.message === "DUPLICATE_ORDER_INDEX" || isPrismaErrorCode(error, "P2002")) {
            return reply.status(409).send({
              error: "Th\u1EE9 t\u1EF1 c\xE2u h\u1ECFi b\u1ECB tr\xF9ng trong c\xF9ng nh\xF3m"
            });
          }
          if (isPrismaErrorCode(error, "P2034")) {
            attempt += 1;
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    }
  );
};
var questions_routes_default = questionsRoutes;

// server/repositories/submission.repository.ts
var SubmissionRepository = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async findById(id, include, select) {
    if (select) {
      return this.prisma.examSubmission.findUnique({
        where: { id },
        select
      });
    }
    return this.prisma.examSubmission.findUnique({
      where: { id },
      include
    });
  }
  async findFirst(where, include, select, orderBy) {
    if (select) {
      return this.prisma.examSubmission.findFirst({
        where,
        select,
        orderBy
      });
    }
    return this.prisma.examSubmission.findFirst({
      where,
      include,
      orderBy
    });
  }
  async findMany(where, skip, take, orderBy, select, include) {
    if (select) {
      return this.prisma.examSubmission.findMany({
        where,
        skip,
        take,
        orderBy,
        select
      });
    }
    return this.prisma.examSubmission.findMany({
      where,
      skip,
      take,
      orderBy,
      include
    });
  }
  async count(where) {
    return this.prisma.examSubmission.count({ where });
  }
  async countAttempts(studentId, examId) {
    return this.prisma.examSubmission.count({
      where: {
        studentId,
        examId,
        status: { in: ["SUBMITTED", "GRADED"] }
      }
    });
  }
  async create(data) {
    return this.prisma.examSubmission.create({ data });
  }
  async update(id, data) {
    return this.prisma.examSubmission.update({
      where: { id },
      data
    });
  }
  async transaction(fn) {
    return this.prisma.$transaction(fn);
  }
};

// server/services/scoring/TextNormalizer.ts
var TextNormalizer = class {
  /**
   * Universal text normalization for IELTS answer matching
   * - Strips leading/trailing whitespace
   * - Collapses consecutive whitespace characters into a single space
   * - Strips trailing/leading peripheral punctuation (. , ! ? ; :)
   * - Lowercases text for uniform case-insensitive comparison
   */
  normalizeText(raw) {
    if (raw === null || raw === void 0) return "";
    let str = typeof raw === "string" ? raw : String(raw);
    str = str.trim();
    if (!str) return "";
    str = str.replace(/\s+/g, " ");
    str = str.toLowerCase();
    str = str.replace(/^[.,!?:;"'“”‘’]+|[.,!?:;"'“”‘’]+$/g, "");
    return str.trim();
  }
  /**
   * Normalizes accepted alternative answers separated by "|"
   * Handles optional parenthetical words like "(a) car" or "(the) station"
   */
  normalizeAlternatives(raw) {
    if (raw === null || raw === void 0) return [];
    const str = typeof raw === "string" ? raw : String(raw);
    if (!str.trim()) return [];
    const rawParts = str.split("|").map((p) => p.trim()).filter(Boolean);
    const results = /* @__PURE__ */ new Set();
    for (const part of rawParts) {
      const normalized = this.normalizeText(part);
      if (normalized) {
        results.add(normalized);
        if (normalized.includes("(") && normalized.includes(")")) {
          const withoutParens = normalized.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
          const withoutOptional = normalized.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
          if (withoutParens) results.add(withoutParens);
          if (withoutOptional) results.add(withoutOptional);
        }
      }
    }
    return Array.from(results);
  }
  /**
   * Converts option representation ('A', 'B', '0', 0, 1) to a 0-based integer index
   */
  normalizeOptionIndex(val) {
    if (val === null || val === void 0) return null;
    if (typeof val === "number" && Number.isInteger(val) && val >= 0) {
      return val;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10);
      }
      if (/^[A-Za-z]$/.test(trimmed)) {
        return trimmed.toUpperCase().charCodeAt(0) - 65;
      }
    }
    return null;
  }
  /**
   * Safely parses JSON strings, returns fallback if parsing fails
   */
  parseJsonSafe(val, fallback = {}) {
    if (val === null || val === void 0) return fallback;
    if (typeof val === "object") return val;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
  /**
   * Evaluates equivalence between a student string and correct answer expression (with alternatives)
   */
  areEquivalent(studentText, correctText) {
    const studentNorm = this.normalizeText(studentText);
    if (!studentNorm) return false;
    const alternatives = this.normalizeAlternatives(correctText);
    if (alternatives.length === 0) {
      return false;
    }
    return alternatives.includes(studentNorm);
  }
};
var defaultTextNormalizer = new TextNormalizer();

// server/services/scoring/AnswerResolver.ts
var AnswerResolver = class {
  /**
   * Extracts and flattens all questions from exam structure and pairs them with student answers
   */
  resolve(examStructure, studentAnswers) {
    const flattenedQuestions = [];
    const sections = examStructure?.sections || [];
    for (const section of sections) {
      const groups = section.questionGroups || [];
      for (const group of groups) {
        const questions = group.questions || [];
        for (const q of questions) {
          let normalizedOptions = q.options;
          if (typeof q.options === "string") {
            try {
              normalizedOptions = JSON.parse(q.options);
            } catch {
              normalizedOptions = [];
            }
          }
          const rawCorrect = String(q.correctAnswer || q.correct_answer || "");
          const correctCount = rawCorrect.split("|").filter((p) => p.trim()).length;
          const isMultiChoice = q.questionType === "multiple_choice_multi" || q.selectionMode === "multiple" || Boolean(q.isMultiChoice) || q.questionType === "multiple_choice" && correctCount > 1;
          const selectionMode = isMultiChoice ? "multiple" : "single";
          const maxSelections = isMultiChoice ? Math.max(2, correctCount) : 1;
          flattenedQuestions.push({
            id: q.id,
            questionType: q.questionType || q.question_type || "multiple_choice",
            questionText: q.questionText || q.question_text || "",
            options: Array.isArray(normalizedOptions) ? normalizedOptions : [],
            correctAnswer: rawCorrect,
            points: q.points !== void 0 && q.points !== null ? Number(q.points) : 1,
            orderIndex: q.orderIndex || q.order_index || 0,
            selectionMode,
            maxSelections
          });
        }
      }
    }
    const answerMap = /* @__PURE__ */ new Map();
    const rawAnswerList = [];
    if (Array.isArray(studentAnswers)) {
      for (const a of studentAnswers) {
        if (!a || !a.questionId) continue;
        const normalizedItem = {
          questionId: a.questionId,
          answerText: a.answerText !== void 0 ? a.answerText : null,
          audioUrl: a.audioUrl || null
        };
        answerMap.set(a.questionId, normalizedItem);
        rawAnswerList.push(normalizedItem);
      }
    }
    return {
      questions: flattenedQuestions,
      answerMap,
      rawAnswerList
    };
  }
};

// server/services/scoring/evaluators/MultipleChoiceEvaluator.ts
var MultipleChoiceEvaluator = class {
  supportedTypes = [
    "multiple_choice",
    "multiple_choice_multi",
    "listening_mcq",
    "reading_mcq"
  ];
  canEvaluate(questionType) {
    return this.supportedTypes.includes(questionType?.toLowerCase());
  }
  evaluate(question, studentAnswer, normalizer) {
    const rawCorrect = question.correctAnswer || "";
    const rawStudent = studentAnswer?.answerText;
    const defaultPoints = question.points && question.points > 0 ? question.points : 1;
    const isMultiSelect = question.selectionMode === "multiple" || question.questionType === "multiple_choice_multi" || question.isMultiChoice === true || question.is_multi_choice === true || typeof question.maxSelections === "number" && question.maxSelections > 1;
    if (isMultiSelect) {
      return this.evaluateMultiSelect(question, rawCorrect, rawStudent, defaultPoints, normalizer);
    }
    return this.evaluateSingleSelect(question, rawCorrect, rawStudent, defaultPoints, normalizer);
  }
  evaluateSingleSelect(question, rawCorrect, rawStudent, points, normalizer) {
    if (!rawCorrect || rawStudent === null || rawStudent === void 0 || rawStudent === "") {
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: false,
        score: 0,
        maxScore: points,
        correctCount: 0,
        itemCount: 1
      };
    }
    const correctIdx = normalizer.normalizeOptionIndex(rawCorrect);
    const studentIdx = normalizer.normalizeOptionIndex(rawStudent);
    let isMatch = false;
    if (correctIdx !== null && studentIdx !== null) {
      isMatch = correctIdx === studentIdx;
    } else {
      isMatch = normalizer.areEquivalent(rawStudent, rawCorrect);
      if (!isMatch && correctIdx !== null && Array.isArray(question.options) && question.options[correctIdx]) {
        isMatch = normalizer.areEquivalent(rawStudent, question.options[correctIdx]);
      }
      if (!isMatch && studentIdx !== null && Array.isArray(question.options) && question.options[studentIdx]) {
        isMatch = normalizer.areEquivalent(question.options[studentIdx], rawCorrect);
      }
    }
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: isMatch,
      score: isMatch ? points : 0,
      maxScore: points,
      correctCount: isMatch ? 1 : 0,
      itemCount: 1
    };
  }
  evaluateMultiSelect(question, rawCorrect, rawStudent, points, normalizer) {
    let correctList = [];
    if (typeof rawCorrect === "string" && rawCorrect.trim().startsWith("[")) {
      correctList = normalizer.parseJsonSafe(rawCorrect, []);
    } else {
      correctList = normalizer.normalizeAlternatives(rawCorrect);
    }
    const expectedCount = typeof question.maxSelections === "number" && question.maxSelections > 0 ? question.maxSelections : correctList.length > 0 ? correctList.length : 2;
    const totalPoints = points >= expectedCount ? points : expectedCount;
    const pointPerChoice = totalPoints / expectedCount;
    let studentSelections = [];
    if (Array.isArray(rawStudent)) {
      studentSelections = rawStudent;
    } else if (typeof rawStudent === "string") {
      const parsed = normalizer.parseJsonSafe(rawStudent, null);
      if (Array.isArray(parsed)) {
        studentSelections = parsed;
      } else if (rawStudent.trim()) {
        studentSelections = [rawStudent.trim()];
      }
    }
    const distinctSelections = Array.from(new Set(studentSelections.map((s) => String(s))));
    let correctMatches = 0;
    const details = [];
    const matchedCorrect = /* @__PURE__ */ new Set();
    for (const sel of distinctSelections) {
      let isItemCorrect = false;
      const selIdx = normalizer.normalizeOptionIndex(sel);
      for (const corr of correctList) {
        if (matchedCorrect.has(corr)) continue;
        const corrIdx = normalizer.normalizeOptionIndex(corr);
        let match = false;
        if (selIdx !== null && corrIdx !== null) {
          match = selIdx === corrIdx;
        } else {
          match = normalizer.areEquivalent(sel, corr);
          if (!match && corrIdx !== null && Array.isArray(question.options) && question.options[corrIdx]) {
            match = normalizer.areEquivalent(sel, question.options[corrIdx]);
          }
          if (!match && selIdx !== null && Array.isArray(question.options) && question.options[selIdx]) {
            match = normalizer.areEquivalent(question.options[selIdx], corr);
          }
        }
        if (match) {
          matchedCorrect.add(corr);
          isItemCorrect = true;
          correctMatches++;
          break;
        }
      }
      details.push({
        key: sel,
        studentValue: sel,
        correctValue: Array.from(matchedCorrect).pop() || null,
        isCorrect: isItemCorrect,
        score: isItemCorrect ? pointPerChoice : 0
      });
    }
    const finalCorrectCount = Math.min(correctMatches, expectedCount);
    const finalScore = finalCorrectCount * pointPerChoice;
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: finalCorrectCount === expectedCount,
      score: finalScore,
      maxScore: totalPoints,
      correctCount: finalCorrectCount,
      itemCount: expectedCount,
      details
    };
  }
};

// server/services/scoring/evaluators/FillBlankEvaluator.ts
var FillBlankEvaluator = class {
  supportedTypes = [
    "fill_blank",
    "short_answer",
    "summary_completion",
    "sentence_completion",
    "listening_fill_blank",
    "reading_fill_blank"
  ];
  canEvaluate(questionType) {
    return this.supportedTypes.includes(questionType?.toLowerCase());
  }
  evaluate(question, studentAnswer, normalizer) {
    const rawCorrect = (question.correctAnswer || "").trim();
    const rawStudent = studentAnswer?.answerText;
    const defaultPoints = question.points && question.points > 0 ? question.points : 1;
    let parsedCorrect = null;
    if (rawCorrect.startsWith("{") || rawCorrect.startsWith("[")) {
      parsedCorrect = normalizer.parseJsonSafe(rawCorrect, null);
    }
    if (parsedCorrect && typeof parsedCorrect === "object" && !Array.isArray(parsedCorrect)) {
      return this.evaluateMultiBlank(question, parsedCorrect, rawStudent, defaultPoints, normalizer);
    }
    return this.evaluateSingleBlank(question, rawCorrect, rawStudent, defaultPoints, normalizer);
  }
  evaluateSingleBlank(question, rawCorrect, rawStudent, points, normalizer) {
    if (!rawCorrect || rawStudent === null || rawStudent === void 0 || rawStudent === "") {
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: false,
        score: 0,
        maxScore: points,
        correctCount: 0,
        itemCount: 1
      };
    }
    let studentText = rawStudent;
    if (typeof rawStudent === "object" && rawStudent !== null) {
      if (Array.isArray(rawStudent)) {
        studentText = rawStudent[0] || "";
      } else {
        studentText = rawStudent["0"] || Object.values(rawStudent)[0] || "";
      }
    } else if (typeof rawStudent === "string" && (rawStudent.startsWith("{") || rawStudent.startsWith("["))) {
      const parsed = normalizer.parseJsonSafe(rawStudent, null);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          studentText = parsed[0] || "";
        } else {
          studentText = parsed["0"] || Object.values(parsed)[0] || "";
        }
      }
    }
    const isMatch = normalizer.areEquivalent(studentText, rawCorrect);
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: isMatch,
      score: isMatch ? points : 0,
      maxScore: points,
      correctCount: isMatch ? 1 : 0,
      itemCount: 1,
      details: [
        {
          key: "0",
          studentValue: studentText,
          correctValue: rawCorrect,
          isCorrect: isMatch,
          score: isMatch ? points : 0
        }
      ]
    };
  }
  evaluateMultiBlank(question, correctMap, rawStudent, points, normalizer) {
    const blankKeys = Object.keys(correctMap).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
    });
    const blankCount = blankKeys.length;
    if (blankCount === 0) {
      return this.evaluateSingleBlank(question, "", rawStudent, points, normalizer);
    }
    const studentMap = {};
    if (rawStudent && typeof rawStudent === "object") {
      if (Array.isArray(rawStudent)) {
        rawStudent.forEach((val, idx) => {
          studentMap[String(idx)] = val;
        });
      } else {
        Object.assign(studentMap, rawStudent);
      }
    } else if (typeof rawStudent === "string" && rawStudent.trim()) {
      const parsed = normalizer.parseJsonSafe(rawStudent, null);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          parsed.forEach((val, idx) => {
            studentMap[String(idx)] = val;
          });
        } else {
          Object.assign(studentMap, parsed);
        }
      } else {
        studentMap["0"] = rawStudent.trim();
      }
    }
    const maxScore = points >= blankCount ? points : blankCount;
    const pointPerBlank = maxScore / blankCount;
    let correctBlanks = 0;
    const details = [];
    for (const key of blankKeys) {
      const correctVal = correctMap[key];
      const studentVal = studentMap[key] !== void 0 ? studentMap[key] : "";
      const isBlankCorrect = normalizer.areEquivalent(studentVal, correctVal);
      if (isBlankCorrect) {
        correctBlanks++;
      }
      details.push({
        key,
        studentValue: studentVal,
        correctValue: correctVal,
        isCorrect: isBlankCorrect,
        score: isBlankCorrect ? pointPerBlank : 0
      });
    }
    const finalScore = correctBlanks * pointPerBlank;
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: correctBlanks === blankCount,
      score: finalScore,
      maxScore,
      correctCount: correctBlanks,
      itemCount: blankCount,
      // CRITICAL FIX: EXACTLY blankCount (N), never N + 1 or N + 2
      details
    };
  }
};

// server/services/scoring/evaluators/MatchingEvaluator.ts
var MatchingEvaluator = class {
  supportedTypes = [
    "matching",
    "matrix_matching",
    "pair_matching",
    "matching_features",
    "matching_headings"
  ];
  canEvaluate(questionType) {
    return this.supportedTypes.includes(questionType?.toLowerCase());
  }
  evaluate(question, studentAnswer, normalizer) {
    const rawCorrect = (question.correctAnswer || "").trim();
    const rawStudent = studentAnswer?.answerText;
    const defaultPoints = question.points && question.points > 0 ? question.points : 1;
    let targetPairs = {};
    const parsedCorrect = normalizer.parseJsonSafe(rawCorrect, null);
    if (parsedCorrect && typeof parsedCorrect === "object") {
      targetPairs = parsedCorrect.pairs || parsedCorrect;
    }
    const pairKeys = Object.keys(targetPairs);
    const pairsCount = pairKeys.length;
    if (pairsCount === 0) {
      const isMatch = normalizer.areEquivalent(rawStudent, rawCorrect);
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: isMatch,
        score: isMatch ? defaultPoints : 0,
        maxScore: defaultPoints,
        correctCount: isMatch ? 1 : 0,
        itemCount: 1
      };
    }
    let studentPairs = {};
    if (rawStudent && typeof rawStudent === "object") {
      studentPairs = rawStudent.pairs || rawStudent;
    } else if (typeof rawStudent === "string" && rawStudent.trim()) {
      const parsed = normalizer.parseJsonSafe(rawStudent, {});
      studentPairs = parsed.pairs || parsed;
    }
    const maxScore = defaultPoints >= pairsCount ? defaultPoints : pairsCount;
    const pointPerPair = maxScore / pairsCount;
    let correctPairs = 0;
    const details = [];
    for (const key of pairKeys) {
      const expectedVal = targetPairs[key];
      const actualVal = studentPairs[key];
      let isPairMatch = false;
      const expectedIdx = normalizer.normalizeOptionIndex(expectedVal);
      const actualIdx = normalizer.normalizeOptionIndex(actualVal);
      if (expectedIdx !== null && actualIdx !== null) {
        isPairMatch = expectedIdx === actualIdx;
      } else {
        isPairMatch = normalizer.areEquivalent(actualVal, expectedVal);
      }
      if (isPairMatch) {
        correctPairs++;
      }
      details.push({
        key,
        studentValue: actualVal,
        correctValue: expectedVal,
        isCorrect: isPairMatch,
        score: isPairMatch ? pointPerPair : 0
      });
    }
    const finalScore = correctPairs * pointPerPair;
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: correctPairs === pairsCount,
      score: finalScore,
      maxScore,
      correctCount: correctPairs,
      itemCount: pairsCount,
      details
    };
  }
};

// server/services/scoring/evaluators/TFNG_Evaluator.ts
var TFNG_Evaluator = class {
  supportedTypes = [
    "true_false_not_given",
    "yes_no_not_given",
    "tfng",
    "ynng",
    "true_false"
  ];
  canEvaluate(questionType) {
    return this.supportedTypes.includes(questionType?.toLowerCase());
  }
  evaluate(question, studentAnswer, normalizer) {
    const rawCorrect = (question.correctAnswer || "").trim();
    const rawStudent = studentAnswer?.answerText;
    const defaultPoints = question.points && question.points > 0 ? question.points : 1;
    if (!rawCorrect || rawStudent === null || rawStudent === void 0 || rawStudent === "") {
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: false,
        score: 0,
        maxScore: defaultPoints,
        correctCount: 0,
        itemCount: 1
      };
    }
    const canonicalCorrect = this.toCanonicalToken(rawCorrect);
    const canonicalStudent = this.toCanonicalToken(rawStudent);
    const isMatch = canonicalCorrect !== "" && canonicalStudent !== "" && canonicalCorrect === canonicalStudent;
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: isMatch,
      score: isMatch ? defaultPoints : 0,
      maxScore: defaultPoints,
      correctCount: isMatch ? 1 : 0,
      itemCount: 1,
      details: [
        {
          key: "0",
          studentValue: rawStudent,
          correctValue: rawCorrect,
          isCorrect: isMatch,
          score: isMatch ? defaultPoints : 0
        }
      ]
    };
  }
  toCanonicalToken(raw) {
    if (raw === null || raw === void 0) return "";
    let str = String(raw).trim().toUpperCase().replace(/[\s_]+/g, " ");
    if (str === "T" || str === "TRUE") return "TRUE";
    if (str === "F" || str === "FALSE") return "FALSE";
    if (str === "NG" || str === "NOT GIVEN" || str === "NOTGIVEN") return "NOT GIVEN";
    if (str === "Y" || str === "YES") return "YES";
    if (str === "N" || str === "NO") return "NO";
    return str;
  }
};

// server/services/scoring/evaluators/ManualEvaluator.ts
var ManualEvaluator = class {
  supportedTypes = [
    "essay",
    "writing",
    "speaking",
    "ielts_writing_task1",
    "ielts_writing_task2",
    "ielts_speaking_part1",
    "ielts_speaking_part2",
    "ielts_speaking_part3",
    "manual_grade",
    "open_question"
  ];
  canEvaluate(questionType) {
    return this.supportedTypes.includes(questionType?.toLowerCase());
  }
  evaluate(question, studentAnswer, _normalizer) {
    const maxScore = question.points && question.points > 0 ? question.points : 1;
    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: true,
      isCorrect: false,
      score: 0,
      maxScore,
      correctCount: 0,
      itemCount: 1,
      details: [
        {
          key: "manual",
          studentValue: studentAnswer?.answerText || studentAnswer?.audioUrl || null,
          correctValue: null,
          isCorrect: false,
          score: 0
        }
      ]
    };
  }
};

// server/services/scoring/evaluators/index.ts
var EVALUATORS = [
  new MultipleChoiceEvaluator(),
  new FillBlankEvaluator(),
  new MatchingEvaluator(),
  new TFNG_Evaluator(),
  new ManualEvaluator()
];
var fallbackEvaluator = new FillBlankEvaluator();
function getEvaluatorForType(questionType) {
  const normalizedType = (questionType || "").toLowerCase();
  for (const evaluator of EVALUATORS) {
    if (evaluator.canEvaluate(normalizedType)) {
      return evaluator;
    }
  }
  return fallbackEvaluator;
}

// server/services/scoring/IeltsBandCalculator.ts
var IeltsBandCalculator = class {
  /**
   * Converts raw score (number of correct answers out of 40) to IELTS Band Score (0.0 - 9.0)
   */
  static calculateBandScore(rawCorrectCount, sectionType = "listening") {
    const score = Math.max(0, Math.min(40, Math.round(rawCorrectCount)));
    if (sectionType === "listening") {
      if (score >= 39) return 9;
      if (score >= 37) return 8.5;
      if (score >= 35) return 8;
      if (score >= 32) return 7.5;
      if (score >= 30) return 7;
      if (score >= 26) return 6.5;
      if (score >= 23) return 6;
      if (score >= 18) return 5.5;
      if (score >= 16) return 5;
      if (score >= 13) return 4.5;
      if (score >= 10) return 4;
      if (score >= 8) return 3.5;
      if (score >= 6) return 3;
      if (score >= 4) return 2.5;
      if (score >= 3) return 2;
      if (score >= 1) return 1;
      return 0;
    }
    if (sectionType === "reading_academic") {
      if (score >= 39) return 9;
      if (score >= 37) return 8.5;
      if (score >= 35) return 8;
      if (score >= 33) return 7.5;
      if (score >= 30) return 7;
      if (score >= 27) return 6.5;
      if (score >= 23) return 6;
      if (score >= 19) return 5.5;
      if (score >= 15) return 5;
      if (score >= 13) return 4.5;
      if (score >= 10) return 4;
      if (score >= 8) return 3.5;
      if (score >= 6) return 3;
      if (score >= 4) return 2.5;
      if (score >= 3) return 2;
      if (score >= 1) return 1;
      return 0;
    }
    if (score >= 40) return 9;
    if (score >= 39) return 8.5;
    if (score >= 37) return 8;
    if (score >= 36) return 7.5;
    if (score >= 34) return 7;
    if (score >= 32) return 6.5;
    if (score >= 30) return 6;
    if (score >= 27) return 5.5;
    if (score >= 23) return 5;
    if (score >= 19) return 4.5;
    if (score >= 15) return 4;
    if (score >= 12) return 3.5;
    if (score >= 9) return 3;
    if (score >= 6) return 2.5;
    if (score >= 4) return 2;
    if (score >= 1) return 1;
    return 0;
  }
  /**
   * Calculates estimated band score based on percentage (for custom tests with < 40 questions)
   */
  static calculateEstimatedBand(percentage) {
    const raw40Equivalent = Math.max(0, Math.min(100, percentage)) / 100 * 40;
    return this.calculateBandScore(raw40Equivalent, "listening");
  }
};

// server/services/scoring/ScoreAggregator.ts
var ScoreAggregator = class {
  /**
   * Aggregates individual question evaluations into a holistic submission grading summary
   */
  aggregate(evaluations) {
    let totalScore = 0;
    let maxScore = 0;
    let correctAnswers = 0;
    let totalQuestions = 0;
    let hasManualQuestions = false;
    for (const res of evaluations) {
      if (res.isManual) {
        hasManualQuestions = true;
        totalQuestions += res.itemCount;
        maxScore += res.maxScore;
      } else {
        totalScore += res.score;
        maxScore += res.maxScore;
        correctAnswers += res.correctCount;
        totalQuestions += res.itemCount;
      }
    }
    const roundedTotalScore = Math.round(totalScore * 100) / 100;
    const percentage = maxScore > 0 ? Math.round(roundedTotalScore / maxScore * 100) : 0;
    const status = hasManualQuestions ? "SUBMITTED" : "GRADED";
    const bandScore = IeltsBandCalculator.calculateEstimatedBand(percentage);
    return {
      totalScore: roundedTotalScore,
      maxScore,
      correctAnswers,
      totalQuestions,
      hasManualQuestions,
      status,
      percentage,
      bandScore,
      evaluatedAnswers: evaluations
    };
  }
};

// server/services/scoring/ResultBuilder.ts
var ResultBuilder = class {
  /**
   * Builds the database persistence payload for Prisma transaction
   */
  buildDatabasePersistencePayload(submissionId, summary, rawAnswers) {
    const submissionUpdate = {
      status: summary.status,
      submittedAt: /* @__PURE__ */ new Date(),
      correctAnswers: summary.correctAnswers,
      totalQuestions: summary.totalQuestions,
      totalScore: summary.totalScore
    };
    const answerMap = new Map(rawAnswers.map((a) => [a.questionId, a]));
    const answerUpdates = summary.evaluatedAnswers.map((evalRes) => {
      const rawAns = answerMap.get(evalRes.questionId);
      const answerTextVal = rawAns?.answerText !== void 0 && rawAns?.answerText !== null ? typeof rawAns.answerText === "string" ? rawAns.answerText : JSON.stringify(rawAns.answerText) : null;
      return {
        questionId: evalRes.questionId,
        score: evalRes.isManual ? null : evalRes.score,
        isCorrect: evalRes.isManual ? null : evalRes.isCorrect,
        answerText: answerTextVal,
        audioUrl: rawAns?.audioUrl || null
      };
    });
    return {
      submissionUpdate,
      answerUpdates
    };
  }
  /**
   * Formats sanitized, safe official submission response for student/client
   */
  buildClientResponse(submissionId, summary) {
    return {
      id: submissionId,
      status: summary.status,
      submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
      correctAnswers: summary.correctAnswers,
      totalQuestions: summary.totalQuestions,
      totalScore: summary.totalScore,
      percentage: summary.percentage,
      hasManualQuestions: summary.hasManualQuestions
    };
  }
};

// server/services/scoring/CanonicalScoringService.ts
var CanonicalScoringService = class {
  normalizer;
  resolver;
  aggregator;
  resultBuilder;
  constructor(normalizer) {
    this.normalizer = normalizer || defaultTextNormalizer;
    this.resolver = new AnswerResolver();
    this.aggregator = new ScoreAggregator();
    this.resultBuilder = new ResultBuilder();
  }
  /**
   * Evaluates an entire exam attempt against canonical IELTS scoring rules
   */
  evaluateExamAttempt(examStructure, studentAnswers) {
    const { questions, answerMap } = this.resolver.resolve(examStructure, studentAnswers);
    const evaluations = questions.map((q) => {
      const studentAns = answerMap.get(q.id);
      const evaluator = getEvaluatorForType(q.questionType);
      return evaluator.evaluate(q, studentAns, this.normalizer);
    });
    return this.aggregator.aggregate(evaluations);
  }
  getResultBuilder() {
    return this.resultBuilder;
  }
  getNormalizer() {
    return this.normalizer;
  }
};
var canonicalScoringService = new CanonicalScoringService();

// server/services/audit/AuditOutboxService.ts
import { randomUUID, createHash } from "crypto";
var AuditOutboxService = class {
  /**
   * Sanitizes payload and builds an immutable audit event record
   * Explicitly strips all forbidden / secret fields (correctAnswer, audioScript, raw answers)
   */
  buildSanitizedEvent(payload) {
    const keyHash = payload.idempotencyKey ? createHash("sha256").update(payload.idempotencyKey).digest("hex") : null;
    const sanitizedOldState = this.sanitizeState(payload.oldState || {});
    const sanitizedNewState = this.sanitizeState(payload.newState || {});
    const sanitizedSummary = this.sanitizeSummary(payload.resultSummary || {});
    return {
      id: randomUUID(),
      eventType: payload.eventType,
      actorId: payload.actorId,
      actorRole: payload.actorRole,
      submissionId: payload.submissionId,
      examId: payload.examId || "unknown",
      requestId: payload.requestId || randomUUID(),
      idempotencyKeyHash: keyHash,
      oldState: JSON.stringify(sanitizedOldState),
      newState: JSON.stringify(sanitizedNewState),
      resultSummary: JSON.stringify(sanitizedSummary),
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  sanitizeState(state) {
    const cleaned = {};
    const allowedKeys = ["status", "totalScore", "correctAnswers", "totalQuestions", "version", "submittedAt", "gradedAt", "gradedBy"];
    for (const key of allowedKeys) {
      if (state[key] !== void 0) {
        cleaned[key] = state[key];
      }
    }
    return cleaned;
  }
  sanitizeSummary(summary) {
    return {
      totalScore: summary.totalScore,
      maxScore: summary.maxScore,
      correctAnswers: summary.correctAnswers,
      totalQuestions: summary.totalQuestions,
      percentage: summary.percentage,
      hasManualQuestions: summary.hasManualQuestions
    };
  }
};
var auditOutboxService = new AuditOutboxService();

// server/services/submission-state-machine.ts
var StateTransitionError = class extends Error {
  statusCode = 409;
  constructor(message) {
    super(message);
    this.name = "StateTransitionError";
  }
};
var SubmissionStateMachine = class {
  static VALID_TRANSITIONS = {
    IN_PROGRESS: ["SUBMITTED", "GRADED"],
    PENDING: ["IN_PROGRESS", "SUBMITTED", "GRADED"],
    SUBMITTED: ["GRADED"],
    GRADED: ["GRADED"]
    // Only allowed via Authorized Regrade Workflow
  };
  /**
   * Validates if a transition from current state to target state is legally permitted
   */
  static canTransition(current, target) {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }
  /**
   * Asserts transition validity or throws a 409 StateTransitionError
   */
  static assertTransition(current, target, isAuthorizedRegrade = false) {
    if (current === "GRADED") {
      if (target === "IN_PROGRESS" || target === "SUBMITTED") {
        throw new StateTransitionError(`INVALID_STATE_TRANSITION: Cannot roll back from GRADED to ${target}. Final state is immutable.`);
      }
      if (target === "GRADED" && !isAuthorizedRegrade) {
        throw new StateTransitionError("SUBMISSION_ALREADY_FINALIZED: Direct modification of GRADED submission is forbidden without an authorized regrade request.");
      }
    }
    if (!this.canTransition(current, target)) {
      throw new StateTransitionError(`INVALID_STATE_TRANSITION: Cannot transition submission from ${current} to ${target}`);
    }
  }
  /**
   * Checks whether the submission is in an immutable finalized state
   */
  static isFinalized(state) {
    return state === "GRADED";
  }
};

// server/services/notification.service.ts
var NotificationService = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Tạo 1 notification trong transaction hoặc direct client context.
   * Nếu vi phạm unique constraint (P2002) do retry cùng business event -> skip an toàn (Idempotency).
   */
  async createNotification(tx, data) {
    try {
      await tx.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          entityType: data.entityType || null,
          entityId: data.entityId || null
        }
      });
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
        const meta = err.meta;
        const target = meta?.target;
        const isIdempotencyCollision = !target || Array.isArray(target) && (target.includes("entity_type") || target.includes("entityId") || target.includes("notifications_idempotency_idx")) || typeof target === "string" && (target.includes("idempotency") || target.includes("notifications"));
        if (isIdempotencyCollision) {
          return;
        }
      }
      throw err;
    }
  }
  /**
   * Tạo batch notifications cho nhiều người nhận bằng 1 single query (createMany).
   * Dùng skipDuplicates: true để bỏ qua các bản ghi trùng lặp.
   */
  async createBatchNotifications(tx, items) {
    if (items.length === 0) return;
    await tx.notification.createMany({
      data: items.map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link || null,
        entityType: item.entityType || null,
        entityId: item.entityId || null
      })),
      skipDuplicates: true
    });
  }
  /**
   * Lấy danh sách notifications của một user cụ thể (có phân trang).
   * Backend xác định ownership, không cho phép query user khác.
   */
  async listNotifications(params) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: params.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      this.prisma.notification.count({
        where: { userId: params.userId }
      })
    ]);
    return { items, total, page, limit };
  }
  /**
   * Đếm số lượng thông báo chưa đọc của user.
   */
  async getUnreadCount(userId) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }
  /**
   * Đánh dấu 1 thông báo là đã đọc.
   * Áp dụng Object-level authorization: chỉ cập nhật nếu bản ghi thuộc đúng userId.
   */
  async markAsRead(id, userId) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id,
        userId
      },
      data: {
        isRead: true,
        readAt: /* @__PURE__ */ new Date()
      }
    });
    return result.count > 0;
  }
  /**
   * Đánh dấu tất cả thông báo chưa đọc của user là đã đọc.
   */
  async markAllAsRead(userId) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: /* @__PURE__ */ new Date()
      }
    });
    return result.count;
  }
};

// server/utils/teacherScope.ts
async function getTeacherStudentIds(prisma, teacherId) {
  const classStudents = await prisma.classStudent.findMany({
    where: {
      class: {
        teacherId
      }
    },
    select: {
      studentId: true
    }
  });
  return [...new Set(classStudents.map((cs) => cs.studentId))];
}
async function getClassStudentIds(prisma, classId) {
  const classStudents = await prisma.classStudent.findMany({
    where: { classId },
    select: { studentId: true }
  });
  return [...new Set(classStudents.map((cs) => cs.studentId))];
}
async function isStudentInTeacherClasses(prisma, teacherId, studentId) {
  const count = await prisma.classStudent.count({
    where: {
      studentId,
      class: {
        teacherId
      }
    }
  });
  return count > 0;
}
async function isTeacherOfClass(prisma, teacherId, classId) {
  const cls = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId
    }
  });
  return !!cls;
}

// server/services/exam-submission.service.ts
var MAX_EXAM_ATTEMPTS = 3;
function getRemainingSeconds(startedAt, durationMinutes) {
  const safeDuration = Math.max(1, durationMinutes || 60);
  if (!startedAt) return safeDuration * 60;
  const startedMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedMs)) return safeDuration * 60;
  const elapsed = Math.floor((Date.now() - startedMs) / 1e3);
  return Math.max(0, safeDuration * 60 - Math.max(0, elapsed));
}
function sanitizeQuestionForStudent(q, showAnswerKey) {
  const cleaned = { ...q };
  if (!showAnswerKey) {
    delete cleaned.correctAnswer;
    delete cleaned.correct_answer;
    delete cleaned.audioScript;
    delete cleaned.audio_script;
    delete cleaned.acceptedAnswers;
    delete cleaned.accepted_answers;
    delete cleaned.answerKey;
    delete cleaned.answer_key;
  }
  return cleaned;
}
var ExamSubmissionService = class {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new SubmissionRepository(prisma);
    this.notificationService = new NotificationService(prisma);
  }
  repo;
  notificationService;
  // Use Case: List Submissions with Role-based filtering
  async listSubmissions(user, query) {
    const { examId, studentId, status, classId, needGrading, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;
    const where = {};
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (!isAdmin && !isTeacher) {
      where.studentId = user.id;
    } else if (isTeacher && !isAdmin) {
      let teacherStudentIds = [];
      if (classId) {
        const owned = await isTeacherOfClass(this.prisma, user.id, classId);
        if (!owned) {
          throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - l\u1EDBp kh\xF4ng thu\u1ED9c quy\u1EC1n qu\u1EA3n l\xFD c\u1EE7a b\u1EA1n", 403);
        }
        teacherStudentIds = await getClassStudentIds(this.prisma, classId);
      } else {
        teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      }
      where.studentId = {
        in: teacherStudentIds.length > 0 ? teacherStudentIds : ["__none__"]
      };
      if (studentId) {
        where.studentId = teacherStudentIds.includes(studentId) ? studentId : "__none__";
      }
    } else if (studentId) {
      where.studentId = studentId;
    }
    if (isAdmin && classId) {
      const classStudentIds = await getClassStudentIds(this.prisma, classId);
      const inClass = classStudentIds.length > 0 ? classStudentIds : ["__none__"];
      where.studentId = studentId ? classStudentIds.includes(studentId) ? studentId : "__none__" : { in: inClass };
    }
    if (examId) where.examId = examId;
    if (status) where.status = status;
    const orderBy = {};
    orderBy[sortBy === "createdAt" ? "createdAt" : sortBy] = sortOrder;
    const [data, total] = await Promise.all([
      this.repo.findMany(
        where,
        skip,
        limit,
        orderBy,
        {
          id: true,
          studentId: true,
          examId: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          gradedAt: true,
          totalScore: true,
          correctAnswers: true,
          totalQuestions: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true
            }
          },
          exam: {
            select: {
              id: true,
              title: true,
              durationMinutes: true
            }
          },
          answers: {
            select: {
              id: true,
              questionId: true,
              answerText: true,
              audioUrl: true,
              score: true,
              feedback: true
            }
          }
        }
      ),
      this.repo.count(where)
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  // Use Case: Get Submission Detail with Ownership check
  async getSubmissionById(user, id) {
    const submission = await this.repo.findById(id, {
      student: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true
        }
      },
      exam: {
        include: {
          sections: {
            include: {
              questionGroups: {
                include: {
                  questions: true
                }
              }
            }
          }
        }
      },
      answers: true
    });
    if (!submission) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y b\xE0i n\u1ED9p");
    }
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (!isAdmin && !isTeacher && submission.studentId !== user.id) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - b\xE0i l\xE0m kh\xF4ng thu\u1ED9c s\u1EDF h\u1EEFu c\u1EE7a b\u1EA1n", 403);
    }
    if (isTeacher && !isAdmin) {
      const teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      if (submission.studentId !== user.id && !teacherStudentIds.includes(submission.studentId)) {
        throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - h\u1ECDc vi\xEAn kh\xF4ng thu\u1ED9c l\u1EDBp b\u1EA1n qu\u1EA3n l\xFD", 403);
      }
    }
    const isGraded = String(submission.status).toUpperCase() === "GRADED";
    const canSeeSecrets = isGraded || isAdmin || isTeacher;
    if (submission.exam?.sections) {
      submission.exam = {
        ...submission.exam,
        sections: submission.exam.sections.map((sec) => {
          const sanitizedSec = { ...sec };
          if (!canSeeSecrets) {
            delete sanitizedSec.audioScript;
            delete sanitizedSec.audio_script;
          }
          sanitizedSec.questionGroups = sec.questionGroups?.map((g) => ({
            ...g,
            questions: g.questions?.map(
              (q) => sanitizeQuestionForStudent(q, canSeeSecrets)
            )
          }));
          return sanitizedSec;
        })
      };
    }
    return submission;
  }
  // Use Case: Start Exam Attempt (with Open Exam & Dual-Channel Authorization)
  async startAttempt(user, examId) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId }
    });
    if (!exam) {
      throw new NotFoundError("B\xE0i thi kh\xF4ng t\u1ED3n t\u1EA1i");
    }
    const isPrivileged = user.roles.includes("admin") || user.roles.includes("teacher");
    const isOpenExam = exam.isOpen === true || exam.is_open === true || exam.openForAll === true;
    if (!isPrivileged && !isOpenExam && exam.courseId) {
      const directEnrollment = await this.prisma.enrollment?.findFirst?.({
        where: { studentId: user.id, courseId: exam.courseId }
      });
      let hasClassMembership = false;
      const classStudents = await this.prisma.classStudent.findMany({
        where: { studentId: user.id }
      });
      if (classStudents.length > 0) {
        const classIds = classStudents.map((cs) => cs.classId);
        const enrolledClasses = await this.prisma.class.findMany({
          where: { id: { in: classIds } }
        });
        hasClassMembership = enrolledClasses.some((c) => c.courseId === exam.courseId);
      }
      if (!directEnrollment && !hasClassMembership) {
        throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp: H\u1ECDc vi\xEAn ch\u01B0a \u0111\u0103ng k\xFD kh\xF3a h\u1ECDc ho\u1EB7c l\u1EDBp h\u1ECDc c\u1EE7a b\xE0i thi n\xE0y", 403);
      }
    }
    const attemptCount = await this.repo.countAttempts(user.id, examId);
    if (!isPrivileged && attemptCount >= MAX_EXAM_ATTEMPTS) {
      throw new AuthorizationError(`B\u1EA1n \u0111\xE3 s\u1EED d\u1EE5ng h\u1EBFt ${MAX_EXAM_ATTEMPTS} l\u01B0\u1EE3t l\xE0m b\xE0i cho b\xE0i thi n\xE0y`, 409);
    }
    return this.repo.transaction(async (tx) => {
      const inProgress = await tx.examSubmission.findFirst({
        where: {
          examId,
          studentId: user.id,
          status: "IN_PROGRESS"
        }
      });
      if (inProgress) {
        const remainingSeconds = getRemainingSeconds(inProgress.startedAt, exam.durationMinutes);
        if (remainingSeconds > 0) {
          return {
            submission: {
              ...inProgress,
              remainingSeconds,
              serverTime: (/* @__PURE__ */ new Date()).toISOString()
            },
            isNew: false
          };
        }
        const answerCount = await tx.answer.count({
          where: { submissionId: inProgress.id }
        });
        if (answerCount === 0) {
          const reset = await tx.examSubmission.update({
            where: { id: inProgress.id },
            data: { startedAt: /* @__PURE__ */ new Date() }
          });
          return {
            submission: {
              ...reset,
              remainingSeconds: Math.max(1, (exam.durationMinutes || 60) * 60),
              serverTime: (/* @__PURE__ */ new Date()).toISOString()
            },
            isNew: false
          };
        }
        await tx.examSubmission.update({
          where: { id: inProgress.id },
          data: {
            status: "SUBMITTED",
            submittedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      const newSubmission = await tx.examSubmission.create({
        data: {
          examId,
          studentId: user.id,
          status: "IN_PROGRESS",
          startedAt: /* @__PURE__ */ new Date(),
          version: 1
        }
      });
      return {
        submission: {
          ...newSubmission,
          remainingSeconds: (exam.durationMinutes || 60) * 60,
          serverTime: (/* @__PURE__ */ new Date()).toISOString()
        },
        isNew: true
      };
    });
  }
  // Use Case: Save Draft Answers (Autosave - checks version conflict and status)
  async saveDraft(user, id, answers, version) {
    const submission = await this.repo.findById(id);
    if (!submission) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y b\xE0i l\xE0m");
    }
    if (submission.studentId !== user.id) {
      throw new AuthorizationError("B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n s\u1EEDa b\xE0i l\xE0m n\xE0y", 403);
    }
    const currentStatus = String(submission.status).toUpperCase();
    if (SubmissionStateMachine.isFinalized(currentStatus)) {
      throw new StateTransitionError("SUBMISSION_ALREADY_FINALIZED");
    }
    if (currentStatus !== "IN_PROGRESS") {
      throw new StateTransitionError("SUBMISSION_ALREADY_FINALIZED");
    }
    if (typeof version === "number" && submission.version !== void 0 && submission.version !== null) {
      if (version <= submission.version) {
        throw new AuthorizationError("STALE_VERSION_CONFLICT", 409);
      }
    }
    return this.repo.transaction(async (tx) => {
      for (const ans of answers) {
        const existingAns = await tx.answer.findFirst({
          where: {
            submissionId: id,
            questionId: ans.questionId
          }
        });
        const answerText = typeof ans.answerText === "object" ? JSON.stringify(ans.answerText) : ans.answerText;
        if (existingAns) {
          await tx.answer.update({
            where: { id: existingAns.id },
            data: {
              answerText,
              audioUrl: ans.audioUrl || null
            }
          });
        } else {
          await tx.answer.create({
            data: {
              submissionId: id,
              questionId: ans.questionId,
              answerText,
              audioUrl: ans.audioUrl || null
            }
          });
        }
      }
      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          version: typeof version === "number" ? version : (submission.version || 1) + 1
        },
        include: { answers: true }
      });
      return {
        ...updated,
        savedCount: answers.length
      };
    });
  }
  // Use Case: Submit Exam with Canonical Scoring & Idempotency
  // CRITICAL: Pure Server Authority — Strips client score/bandScore/isCorrect injections
  async submitExam(user, id, payload) {
    if (payload.idempotencyKey) {
      let existingIdem = null;
      if (this.prisma.idempotencyRecords) {
        existingIdem = await this.prisma.idempotencyRecord?.findFirst?.({
          where: { key: payload.idempotencyKey }
        });
      }
      if (existingIdem) {
        const cached = typeof existingIdem.responsePayload === "string" ? JSON.parse(existingIdem.responsePayload) : existingIdem.responsePayload;
        const cachedAnswers = cached.answers || [];
        const incomingAnswers = payload.answers || [];
        let isDifferent = false;
        if (incomingAnswers.length !== cachedAnswers.length) {
          isDifferent = true;
        } else {
          for (let i = 0; i < incomingAnswers.length; i++) {
            const incAns = incomingAnswers[i];
            const cachedAns = cachedAnswers.find((ca) => ca.questionId === incAns.questionId);
            const incText = typeof incAns.answerText === "object" ? JSON.stringify(incAns.answerText) : incAns.answerText;
            const caText = typeof cachedAns?.answerText === "object" ? JSON.stringify(cachedAns?.answerText) : cachedAns?.answerText;
            if (!cachedAns || incText !== caText) {
              isDifferent = true;
              break;
            }
          }
        }
        if (isDifferent) {
          throw new AuthorizationError("IDEMPOTENCY_CONFLICT", 409);
        }
        return cached;
      }
    }
    const submission = await this.repo.findById(id, {
      exam: {
        include: {
          sections: {
            include: {
              questionGroups: {
                include: {
                  questions: true
                }
              }
            }
          }
        }
      }
    });
    if (!submission) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y b\xE0i l\xE0m");
    }
    if (submission.studentId !== user.id) {
      throw new AuthorizationError("B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n n\u1ED9p b\xE0i l\xE0m n\xE0y", 403);
    }
    const currentStatus = String(submission.status).toUpperCase();
    if (currentStatus === "GRADED") {
      return submission;
    }
    let answersToEvaluate = payload.answers || [];
    if (answersToEvaluate.length === 0) {
      const dbAnswers = await this.prisma.answer.findMany({
        where: { submissionId: id }
      });
      answersToEvaluate = dbAnswers.map((a) => ({
        questionId: a.questionId,
        answerText: a.answerText,
        audioUrl: a.audioUrl
      }));
    }
    const examStructure = submission.exam;
    const gradingSummary = canonicalScoringService.evaluateExamAttempt(
      examStructure,
      answersToEvaluate
    );
    const hasManualQuestions = gradingSummary.hasManualQuestions;
    const targetStatus = hasManualQuestions ? "SUBMITTED" : "GRADED";
    SubmissionStateMachine.assertTransition(currentStatus, targetStatus);
    return this.repo.transaction(async (tx) => {
      const createdOrUpdatedAnswers = [];
      for (const ans of answersToEvaluate) {
        const evalResult = gradingSummary.evaluatedAnswers.find((g) => g.questionId === ans.questionId);
        const answerText = typeof ans.answerText === "object" ? JSON.stringify(ans.answerText) : ans.answerText;
        const existingAns = await tx.answer.findFirst({
          where: { submissionId: id, questionId: ans.questionId }
        });
        if (existingAns) {
          const u = await tx.answer.update({
            where: { id: existingAns.id },
            data: {
              answerText,
              audioUrl: ans.audioUrl || null,
              score: evalResult ? evalResult.score : null
            }
          });
          createdOrUpdatedAnswers.push(u);
        } else {
          const c = await tx.answer.create({
            data: {
              submissionId: id,
              questionId: ans.questionId,
              answerText,
              audioUrl: ans.audioUrl || null,
              score: evalResult ? evalResult.score : null
            }
          });
          createdOrUpdatedAnswers.push(c);
        }
      }
      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          status: targetStatus,
          submittedAt: /* @__PURE__ */ new Date(),
          gradedAt: targetStatus === "GRADED" ? /* @__PURE__ */ new Date() : null,
          totalScore: gradingSummary.totalScore,
          correctAnswers: gradingSummary.correctAnswers,
          totalQuestions: gradingSummary.totalQuestions,
          version: (submission.version || 1) + 1
        }
      });
      const fullResult = {
        ...updated,
        answers: createdOrUpdatedAnswers,
        bandScore: gradingSummary.bandScore
      };
      if (tx.auditOutboxList && tx.auditOutbox) {
        const auditEvent = auditOutboxService.buildSanitizedEvent({
          eventType: "SUBMISSION_FINALIZED",
          actorId: user.id,
          actorRole: user.roles[0] || "student",
          submissionId: id,
          examId: submission.examId,
          idempotencyKey: payload.idempotencyKey,
          oldState: { status: submission.status, totalScore: submission.totalScore },
          newState: { status: targetStatus, totalScore: gradingSummary.totalScore },
          resultSummary: gradingSummary
        });
        await tx.auditOutbox.create({ data: auditEvent });
      }
      if (payload.idempotencyKey && tx.idempotencyRecords && tx.idempotencyRecord) {
        await tx.idempotencyRecord.create({
          data: {
            key: payload.idempotencyKey,
            submissionId: id,
            payloadHash: "sha256-mock",
            responsePayload: JSON.stringify(fullResult)
          }
        });
      }
      if (tx.notification) {
        const examTitle = submission.exam?.title || "IELTS Exam";
        if (targetStatus === "SUBMITTED") {
          let teacherId = null;
          if (submission.exam?.courseId && tx.classStudent) {
            const classStudent = await tx.classStudent.findFirst({
              where: {
                studentId: user.id,
                class: { courseId: submission.exam.courseId, isActive: true }
              },
              include: { class: true }
            });
            teacherId = classStudent?.class?.teacherId || null;
          }
          if (!teacherId && tx.userRole) {
            const firstTeacher = await tx.userRole.findFirst({
              where: { role: "teacher" }
            });
            teacherId = firstTeacher?.userId || null;
          }
          if (teacherId) {
            await this.notificationService.createNotification(tx, {
              userId: teacherId,
              type: "NEW_SUBMISSION",
              title: "B\xE0i n\u1ED9p m\u1EDBi c\u1EA7n ch\u1EA5m",
              message: `H\u1ECDc vi\xEAn \u0111\xE3 n\u1ED9p b\xE0i thi "${examTitle}". Vui l\xF2ng ch\u1EA5m \u0111i\u1EC3m v\xE0 g\u1EEDi feedback.`,
              link: `/admin/submissions/${id}`,
              entityType: "SUBMISSION",
              entityId: id
            });
          }
        } else if (targetStatus === "GRADED") {
          const bandText = gradingSummary.bandScore !== null && gradingSummary.bandScore !== void 0 ? ` K\u1EBFt qu\u1EA3: Band ${gradingSummary.bandScore}.` : "";
          await this.notificationService.createNotification(tx, {
            userId: user.id,
            type: "SUBMISSION_GRADED",
            title: "K\u1EBFt qu\u1EA3 b\xE0i thi",
            message: `B\xE0i thi "${examTitle}" c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c ch\u1EA5m xong.${bandText}`,
            link: `/results/${id}`,
            entityType: "SUBMISSION",
            entityId: id
          });
        }
      }
      return fullResult;
    });
  }
  // Use Case: Start Revision Attempt (P1 Canonical Learning Loop)
  async startRevision(user, examId, options) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId }
    });
    if (!exam) {
      throw new NotFoundError("B\xE0i thi kh\xF4ng t\u1ED3n t\u1EA1i");
    }
    const existingInProgress = await this.prisma.examSubmission.findFirst({
      where: {
        examId,
        studentId: user.id,
        status: "IN_PROGRESS"
      },
      include: { answers: true }
    });
    if (existingInProgress) {
      return {
        submission: existingInProgress,
        isNew: false
      };
    }
    const latestSubmission = await this.prisma.examSubmission.findFirst({
      where: {
        examId,
        studentId: user.id
      },
      orderBy: { createdAt: "desc" },
      include: { answers: true }
    });
    if (!latestSubmission) {
      throw new AuthorizationError("Ch\u01B0a c\xF3 b\xE0i n\u1ED9p n\xE0o tr\u01B0\u1EDBc \u0111\xF3 \u0111\u1EC3 s\u1EEDa. Vui l\xF2ng l\xE0m b\xE0i l\u1EA7n \u0111\u1EA7u.", 400);
    }
    const latestStatus = String(latestSubmission.status).toUpperCase();
    if (latestStatus !== "GRADED") {
      throw new AuthorizationError("B\xE0i n\u1ED9p tr\u01B0\u1EDBc \u0111\xF3 ch\u01B0a \u0111\u01B0\u1EE3c ch\u1EA5m \u0111i\u1EC3m. Ch\u1EC9 c\xF3 th\u1EC3 s\u1EEDa b\xE0i sau khi \u0111\xE3 c\xF3 \u0111\xE1nh gi\xE1 t\u1EEB gi\xE1o vi\xEAn.", 400);
    }
    let isRevisionRequired = true;
    for (const ans of latestSubmission.answers || []) {
      if (ans.feedback) {
        try {
          const parsed = JSON.parse(ans.feedback);
          if (parsed && typeof parsed === "object" && parsed.revisionRequired !== void 0) {
            isRevisionRequired = !!parsed.revisionRequired;
            break;
          }
        } catch {
        }
      }
    }
    if (!isRevisionRequired) {
      throw new AuthorizationError("B\xE0i n\u1ED9p \u0111\xE3 \u0111\u1EA1t y\xEAu c\u1EA7u ho\u1EB7c gi\xE1o vi\xEAn kh\xF4ng y\xEAu c\u1EA7u s\u1EEDa b\xE0i.", 400);
    }
    return this.repo.transaction(async (tx) => {
      const newSubmission = await tx.examSubmission.create({
        data: {
          examId,
          studentId: user.id,
          status: "IN_PROGRESS",
          startedAt: /* @__PURE__ */ new Date()
        }
      });
      if (options?.clonePreviousAnswers && latestSubmission.answers?.length > 0) {
        for (const prevAnswer of latestSubmission.answers) {
          await tx.answer.create({
            data: {
              submissionId: newSubmission.id,
              questionId: prevAnswer.questionId,
              answerText: prevAnswer.answerText,
              audioUrl: prevAnswer.audioUrl
            }
          });
        }
      }
      const created = await tx.examSubmission.findUnique({
        where: { id: newSubmission.id },
        include: { answers: true }
      });
      return {
        submission: created,
        isNew: true
      };
    });
  }
  // Use Case: Teacher Grades Manual Submission (Essay/Speaking / P1 Feedback)
  async gradeManualSubmission(user, id, grades, totalScore, options) {
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (!isAdmin && !isTeacher) {
      throw new AuthorizationError("Ch\u1EC9 gi\xE1o vi\xEAn ho\u1EB7c admin m\u1EDBi c\xF3 quy\u1EC1n ch\u1EA5m b\xE0i", 403);
    }
    const submission = await this.repo.findById(id, { exam: true });
    if (!submission) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y b\xE0i n\u1ED9p");
    }
    if (isTeacher && !isAdmin) {
      const teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      if (!teacherStudentIds.includes(submission.studentId)) {
        throw new AuthorizationError("H\u1ECDc vi\xEAn kh\xF4ng thu\u1ED9c l\u1EDBp do b\u1EA1n ph\u1EE5 tr\xE1ch", 403);
      }
    }
    const currentStatus = String(submission.status).toUpperCase();
    SubmissionStateMachine.assertTransition(currentStatus, "GRADED", true);
    return this.repo.transaction(async (tx) => {
      let computedTotal = 0;
      for (let i = 0; i < grades.length; i++) {
        const g = grades[i];
        let answerFeedback = g.feedback || null;
        if (i === 0 && options && (options.feedback || options.primaryErrorCategory !== void 0 || options.revisionRequired !== void 0 || options.criteriaScores !== void 0)) {
          const structuredPayload = {
            text: options.feedback || g.feedback || "",
            primaryErrorCategory: options.primaryErrorCategory || null,
            revisionRequired: !!options.revisionRequired,
            criteriaScores: options.criteriaScores || null
          };
          answerFeedback = JSON.stringify(structuredPayload);
        }
        if (g.answerId) {
          await tx.answer.update({
            where: { id: g.answerId },
            data: {
              score: g.score,
              feedback: answerFeedback
            }
          });
        } else {
          const fallbackAns = await tx.answer.findFirst({
            where: { submissionId: id }
          });
          if (fallbackAns) {
            await tx.answer.update({
              where: { id: fallbackAns.id },
              data: {
                score: g.score,
                feedback: answerFeedback
              }
            });
          }
        }
        computedTotal += g.score;
      }
      const allAnswers = await tx.answer.findMany({
        where: { submissionId: id }
      });
      const finalTotalScore = typeof totalScore === "number" ? totalScore : allAnswers.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          status: "GRADED",
          gradedAt: /* @__PURE__ */ new Date(),
          gradedBy: user.id,
          totalScore: finalTotalScore
        },
        include: { answers: true }
      });
      if (tx.auditOutboxList && tx.auditOutbox) {
        const auditEvent = auditOutboxService.buildSanitizedEvent({
          eventType: "TEACHER_REGRADED",
          actorId: user.id,
          actorRole: user.roles.includes("admin") ? "admin" : "teacher",
          submissionId: id,
          examId: submission.examId,
          oldState: { status: submission.status, totalScore: submission.totalScore },
          newState: { status: "GRADED", totalScore: finalTotalScore }
        });
        await tx.auditOutbox.create({ data: auditEvent });
      }
      if (tx.notification && submission.studentId) {
        const examTitle = submission.exam?.title || "IELTS Exam";
        await this.notificationService.createNotification(tx, {
          userId: submission.studentId,
          type: "TEACHER_FEEDBACK",
          title: "Gi\xE1o vi\xEAn \u0111\xE3 ch\u1EA5m b\xE0i thi",
          message: `Th\u1EA7y/C\xF4 \u0111\xE3 ch\u1EA5m v\xE0 g\u1EEDi nh\u1EADn x\xE9t cho b\xE0i thi "${examTitle}" c\u1EE7a b\u1EA1n.`,
          link: `/results/${id}`,
          entityType: "SUBMISSION",
          entityId: id
        });
      }
      return updated;
    });
  }
  // Use Case: Authorized Regrade Workflow (G4 Core)
  async regradeSubmission(user, id, data) {
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (!isAdmin && !isTeacher) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp: Ch\u1EC9 gi\xE1o vi\xEAn qu\u1EA3n l\xFD l\u1EDBp ho\u1EB7c qu\u1EA3n tr\u1ECB vi\xEAn m\u1EDBi \u0111\u01B0\u1EE3c ph\xE9p ph\xFAc kh\u1EA3o/ch\u1EA5m l\u1EA1i b\xE0i thi", 403);
    }
    if (!data.reason || typeof data.reason !== "string" || data.reason.trim().length < 5) {
      throw new AuthorizationError("Y\xEAu c\u1EA7u ph\xFAc kh\u1EA3o b\u1EAFt bu\u1ED9c ph\u1EA3i c\xF3 l\xFD do chi ti\u1EBFt (t\u1ED1i thi\u1EC3u 5 k\xFD t\u1EF1)", 400);
    }
    const submission = await this.repo.findById(id, {
      exam: {
        include: {
          sections: {
            include: {
              questionGroups: {
                include: {
                  questions: true
                }
              }
            }
          }
        }
      },
      answers: true
    });
    if (!submission) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y b\xE0i n\u1ED9p c\u1EA7n ch\u1EA5m l\u1EA1i");
    }
    if (isTeacher && !isAdmin) {
      const teacherStudentIds = await getTeacherStudentIds(this.prisma, user.id);
      if (!teacherStudentIds.includes(submission.studentId)) {
        throw new AuthorizationError("H\u1ECDc vi\xEAn kh\xF4ng thu\u1ED9c l\u1EDBp do b\u1EA1n ph\u1EE5 tr\xE1ch", 403);
      }
    }
    const previousScore = Number(submission.totalScore) || 0;
    const currentStatus = String(submission.status).toUpperCase();
    SubmissionStateMachine.assertTransition(currentStatus, "GRADED", true);
    return this.repo.transaction(async (tx) => {
      let finalTotalScore = previousScore;
      let finalCorrectCount = submission.correctAnswers || 0;
      if (data.regradeAll) {
        const rawAnswers = (submission.answers || []).map((a) => ({
          questionId: a.questionId,
          answerText: a.answerText,
          audioUrl: a.audioUrl
        }));
        const gradingSummary = canonicalScoringService.evaluateExamAttempt(
          submission.exam,
          rawAnswers
        );
        for (const ans of rawAnswers) {
          const evalResult = gradingSummary.evaluatedAnswers.find((g) => g.questionId === ans.questionId);
          if (evalResult) {
            await tx.answer.updateMany({
              where: { submissionId: id, questionId: ans.questionId },
              data: { score: evalResult.score }
            });
          }
        }
        finalTotalScore = gradingSummary.totalScore;
        finalCorrectCount = gradingSummary.correctAnswers;
      }
      if (data.grades && data.grades.length > 0) {
        for (const g of data.grades) {
          await tx.answer.update({
            where: { id: g.answerId },
            data: {
              score: g.score,
              feedback: g.feedback || null
            }
          });
        }
        const allAnswers = await tx.answer.findMany({ where: { submissionId: id } });
        finalTotalScore = allAnswers.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
      }
      const updated = await tx.examSubmission.update({
        where: { id },
        data: {
          status: "GRADED",
          gradedAt: /* @__PURE__ */ new Date(),
          gradedBy: user.id,
          totalScore: finalTotalScore,
          correctAnswers: finalCorrectCount,
          version: (submission.version || 1) + 1
        },
        include: { answers: true }
      });
      if (tx.auditOutboxList && tx.auditOutbox) {
        const auditEvent = auditOutboxService.buildSanitizedEvent({
          eventType: "SUBMISSION_REGRADED",
          actorId: user.id,
          actorRole: isAdmin ? "admin" : "teacher",
          submissionId: id,
          examId: submission.examId,
          oldState: { status: submission.status, totalScore: previousScore },
          newState: { status: "GRADED", totalScore: finalTotalScore },
          reason: data.reason.trim()
        });
        await tx.auditOutbox.create({ data: auditEvent });
      }
      return {
        ...updated,
        regradeReason: data.reason.trim(),
        previousScore
      };
    });
  }
};

// server/controllers/submission.controller.ts
var SubmissionController = class {
  service;
  constructor(fastify) {
    this.service = new ExamSubmissionService(fastify.prisma);
  }
  async list(request, reply) {
    const dataQuery = handleValidation(
      paginationSchema.safeParse(request.query),
      request,
      reply
    );
    if (!dataQuery) return;
    try {
      const user = request.user;
      const result = await this.service.listSubmissions(user, {
        ...dataQuery,
        ...request.query
      });
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async getById(request, reply) {
    try {
      const user = request.user;
      const submission = await this.service.getSubmissionById(user, request.params.id);
      return reply.send(submission);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async start(request, reply) {
    try {
      const user = request.user;
      const { examId } = request.body || {};
      if (!examId) {
        return reply.status(400).send({ error: "examId l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const { submission, isNew } = await this.service.startAttempt(user, examId);
      return reply.status(isNew ? 201 : 200).send(submission);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async saveDraft(request, reply) {
    try {
      const user = request.user;
      const { answers, version } = request.body || {};
      const result = await this.service.saveDraft(user, request.params.id, answers || [], version);
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async submit(request, reply) {
    try {
      const user = request.user;
      const payload = request.body || { answers: [] };
      const result = await this.service.submitExam(user, request.params.id, payload);
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async startRevision(request, reply) {
    try {
      const user = request.user;
      const { examId, clonePreviousAnswers } = request.body || {};
      if (!examId) {
        return reply.status(400).send({ error: "examId l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const { submission, isNew } = await this.service.startRevision(user, examId, { clonePreviousAnswers });
      return reply.status(isNew ? 201 : 200).send(submission);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async grade(request, reply) {
    try {
      const user = request.user;
      const { grades = [], totalScore, feedback, primaryErrorCategory, revisionRequired, criteriaScores } = request.body || {};
      const result = await this.service.gradeManualSubmission(user, request.params.id, grades, totalScore, {
        feedback,
        primaryErrorCategory,
        revisionRequired,
        criteriaScores
      });
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async regrade(request, reply) {
    try {
      const user = request.user;
      const result = await this.service.regradeSubmission(user, request.params.id, request.body || { reason: "" });
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
};

// server/routes/submissions.routes.ts
async function submissionsRoutes(fastify) {
  const controller = new SubmissionController(fastify);
  fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
    return controller.list(request, reply);
  });
  fastify.post("/", { preHandler: authenticate }, async (request, reply) => {
    return controller.start(request, reply);
  });
  fastify.post(
    "/revision",
    { preHandler: authenticate },
    async (request, reply) => {
      return controller.startRevision(request, reply);
    }
  );
  fastify.get("/:id", { preHandler: authenticate }, async (request, reply) => {
    return controller.getById(request, reply);
  });
  fastify.put(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      return controller.saveDraft(request, reply);
    }
  );
  fastify.post(
    "/:id/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      return controller.submit(request, reply);
    }
  );
  fastify.post(
    "/:id/grade",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.grade(request, reply);
    }
  );
  fastify.post(
    "/:id/regrade",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.regrade(request, reply);
    }
  );
}

// server/utils/password.ts
import bcrypt from "bcrypt";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// server/routes/users.routes.ts
var usersRoutes = async (fastify) => {
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const dataQuery = handleValidation(
        paginationSchema.safeParse(request.query),
        request,
        reply
      );
      if (!dataQuery) return;
      const { role } = request.query;
      const {
        page,
        limit,
        search,
        sortBy = "createdAt",
        sortOrder
      } = dataQuery;
      const skip = (page - 1) * limit;
      const where = {};
      const user = request.user;
      const isAdmin = user.roles.includes("admin");
      const isTeacher = user.roles.includes("teacher");
      if (isTeacher && !isAdmin) {
        const teacherStudentIds = await getTeacherStudentIds(
          fastify.prisma,
          user.id
        );
        where.userId = { in: teacherStudentIds };
      }
      if (search) {
        where.OR = [
          { email: { contains: search } },
          { fullName: { contains: search } }
        ];
      }
      if (role) {
        where.roles = {
          some: { role }
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
              select: { enrollments: true, submissions: true }
            }
          }
        }),
        fastify.prisma.user.count({ where })
      ]);
      const users = data.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role)
      }));
      return {
        data: withFileUrlsMany(users, ["avatarUrl"]),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      };
    }
  );
  fastify.get(
    "/students-management",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { page = 1, limit = 10, search } = request.query || {};
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      const user = request.user;
      const isAdmin = user.roles.includes("admin");
      const isTeacher = user.roles.includes("teacher");
      const where = {
        roles: {
          some: { role: "student" }
        }
      };
      if (isTeacher && !isAdmin) {
        const teacherStudentIds = await getTeacherStudentIds(fastify.prisma, user.id);
        where.id = { in: teacherStudentIds };
      }
      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } }
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
        fastify.prisma.user.count({ where })
      ]);
      const items = await Promise.all(studentsData.map(async (st) => {
        const classesMap = /* @__PURE__ */ new Map();
        (st.classesAsStudent || []).forEach((cs) => {
          if (cs.class) {
            classesMap.set(cs.class.id, {
              id: cs.class.id,
              name: cs.class.name,
              courseId: cs.class.courseId,
              courseTitle: cs.class.course?.title || void 0
            });
          }
        });
        const classes = Array.from(classesMap.values());
        const examSubs = st.submissions || [];
        const totalAssignedCount = examSubs.length;
        const submittedCount = examSubs.filter((s) => s.status === "submitted" || s.status === "graded" || s.status === "SUBMITTED" || s.status === "GRADED").length;
        const gradedCount = examSubs.filter((s) => s.status === "graded" || s.status === "GRADED").length;
        const attendances = st.attendanceRecords || [];
        const totalSessions = attendances.length;
        const attendedCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "present").length;
        const attendancePercentage = totalSessions > 0 ? Math.round(attendedCount / totalSessions * 100) : null;
        let lastActivity = null;
        const allActivities = [];
        examSubs.forEach((s) => {
          if (s.submittedAt) {
            allActivities.push({
              type: "submission",
              title: s.exam?.title || "B\xE0i thi",
              score: s.totalScore ? Number(s.totalScore) : null,
              timestamp: new Date(s.submittedAt).toISOString()
            });
          }
        });
        if (allActivities.length > 0) {
          allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          lastActivity = allActivities[0];
        }
        let academicHealth = null;
        if (totalAssignedCount > 0) {
          const hwProgressRatio = submittedCount / totalAssignedCount;
          const gradedRatio = submittedCount > 0 ? gradedCount / submittedCount : 0;
          if (totalSessions > 0) {
            const attRatio = attendedCount / totalSessions;
            const score = (attRatio * 0.3 + hwProgressRatio * 0.4 + gradedRatio * 0.3) * 100;
            academicHealth = Math.round(score);
          } else {
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
            percentage: submittedCount > 0 ? 100 : null
          },
          attendance: {
            attendedCount,
            totalSessions,
            percentage: attendancePercentage
          },
          lastActivity,
          academicHealth
        };
      }));
      return reply.send({
        success: true,
        data: withFileUrlsMany(items, ["avatarUrl"]),
        meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
      });
    }
  );
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
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
            include: { course: { select: { id: true, title: true } } }
          }
        }
      });
      if (!user) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" });
      }
      const currentUser = request.user;
      const isCurrentAdmin = currentUser.roles.includes("admin");
      const isCurrentTeacher = currentUser.roles.includes("teacher");
      if (isCurrentTeacher && !isCurrentAdmin) {
        const hasAccess = await isStudentInTeacherClasses(
          fastify.prisma,
          currentUser.id,
          id
        );
        if (!hasAccess) {
          return reply.status(403).send({
            error: "T\u1EEB ch\u1ED1i truy c\u1EADp - ng\u01B0\u1EDDi d\xF9ng kh\xF4ng thu\u1ED9c l\u1EDBp b\u1EA1n ph\u1EE5 tr\xE1ch"
          });
        }
      }
      const userWithRoles = {
        ...user,
        id: user.userId,
        roles: user.roles.map((r) => r.role)
      };
      return withFileUrls(userWithRoles, ["avatarUrl"]);
    }
  );
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const {
        email,
        password,
        fullName,
        role = "student",
        gender,
        dateOfBirth,
        phone,
        parentName,
        parentPhone
      } = request.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return reply.status(400).send({ error: "Email kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const existing = await fastify.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (existing) {
        return reply.status(409).send({ error: "Email \u0111\xE3 t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng" });
      }
      const finalPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(finalPassword);
      let createdUserId = null;
      try {
        const user = await fastify.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              userId: crypto.randomUUID(),
              email: email.trim().toLowerCase(),
              fullName,
              gender,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : void 0,
              phone,
              parentName,
              parentPhone,
              roles: {
                create: { role }
              }
            },
            include: { roles: true }
          });
          createdUserId = newUser.id;
          return newUser;
        });
        return reply.status(201).send({
          id: user.userId,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles?.map((r) => r.role) || [role],
          createdAt: user.createdAt
        });
      } catch (err) {
        if (createdUserId) {
          try {
            await fastify.prisma.user.delete({ where: { id: createdUserId } });
          } catch (cleanupErr) {
            request.log.error(cleanupErr, "Compensation cleanup error during user creation");
          }
        }
        throw err;
      }
    }
  );
  fastify.put(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      const {
        fullName,
        isActive,
        role,
        gender,
        dateOfBirth,
        phone,
        parentName,
        parentPhone
      } = request.body;
      const user = await fastify.prisma.user.update({
        where: { userId: id },
        data: {
          ...fullName !== void 0 && { fullName },
          ...isActive !== void 0 && { isActive },
          ...gender !== void 0 && { gender },
          ...dateOfBirth !== void 0 && {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
          },
          ...phone !== void 0 && { phone },
          ...parentName !== void 0 && { parentName },
          ...parentPhone !== void 0 && { parentPhone }
        },
        include: { roles: true }
      });
      if (role) {
        await fastify.prisma.userRole.deleteMany({
          where: { userId: user.id }
        });
        await fastify.prisma.userRole.create({
          data: { userId: user.id, role }
        });
      }
      return {
        id: user.userId,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
        roles: role ? [role] : user.roles.map((r) => r.role)
      };
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      await fastify.prisma.user.delete({ where: { userId: id } });
      return { success: true };
    }
  );
};
var users_routes_default = usersRoutes;

// server/routes/enrollments.routes.ts
var enrollmentsRoutes = async (fastify) => {
  fastify.get("/", { preHandler: authenticate }, async (request) => {
    const user = request.user;
    const enrollments = await fastify.prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            creator: { select: { id: true, fullName: true } },
            _count: { select: { exams: true } }
          }
        }
      },
      orderBy: { enrolledAt: "desc" }
    });
    return { data: enrollments };
  });
  fastify.get(
    "/course/:courseId",
    { preHandler: authenticate },
    async (request, reply) => {
      const { courseId } = request.params;
      const user = request.user;
      const isAdminOrTeacher = user.roles.includes("admin") || user.roles.includes("teacher");
      if (!isAdminOrTeacher) {
        return reply.status(403).send({ error: "T\u1EEB ch\u1ED1i truy c\u1EADp" });
      }
      const enrollments = await fastify.prisma.enrollment.findMany({
        where: { courseId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { enrolledAt: "desc" }
      });
      return { data: enrollments };
    }
  );
  fastify.post("/", { preHandler: authenticate }, async (request, reply) => {
    const { courseId, studentId } = request.body;
    const user = request.user;
    if (!courseId) {
      return reply.status(400).send({ error: "Y\xEAu c\u1EA7u courseId" });
    }
    let targetStudentId = user.id;
    if (studentId) {
      const isAdminOrTeacher = user.roles.includes("admin") || user.roles.includes("teacher");
      if (!isAdminOrTeacher) {
        return reply.status(403).send({ error: "T\u1EEB ch\u1ED1i truy c\u1EADp" });
      }
      targetStudentId = studentId;
    }
    const course = await fastify.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) {
      return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y kh\xF3a h\u1ECDc" });
    }
    if (!course.isPublished) {
      return reply.status(400).send({ error: "Kh\xF3a h\u1ECDc kh\xF4ng kh\u1EA3 d\u1EE5ng \u0111\u1EC3 \u0111\u0103ng k\xFD" });
    }
    const existing = await fastify.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: targetStudentId
        }
      }
    });
    if (existing) {
      return existing;
    }
    const enrollment = await fastify.prisma.enrollment.create({
      data: {
        courseId,
        studentId: targetStudentId
      },
      include: {
        course: true,
        student: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });
    return reply.status(201).send(enrollment);
  });
  fastify.put(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const { progressPercent } = request.body;
      const user = request.user;
      const enrollment = await fastify.prisma.enrollment.findUnique({
        where: { id }
      });
      if (!enrollment) {
        return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u0103ng k\xFD" });
      }
      if (enrollment.studentId !== user.id) {
        return reply.status(403).send({ error: "T\u1EEB ch\u1ED1i truy c\u1EADp" });
      }
      const updated = await fastify.prisma.enrollment.update({
        where: { id },
        data: { progressPercent }
      });
      return updated;
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user;
      const enrollment = await fastify.prisma.enrollment.findUnique({
        where: { id }
      });
      if (!enrollment) {
        return reply.status(404).send({ error: "Enrollment not found" });
      }
      const isAdmin = user.roles.includes("admin");
      if (!isAdmin && enrollment.studentId !== user.id) {
        return reply.status(403).send({ error: "T\u1EEB ch\u1ED1i truy c\u1EADp" });
      }
      await fastify.prisma.enrollment.delete({ where: { id } });
      return { success: true };
    }
  );
};
var enrollments_routes_default = enrollmentsRoutes;

// server/routes/uploads.routes.ts
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, extname } from "path";
import { pipeline } from "stream/promises";
import { randomUUID as randomUUID2 } from "crypto";
var ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];
var ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm"
];
var ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];
function getUploadDir(subDir) {
  const baseDir = join(process.cwd(), env.UPLOAD_DIR);
  const targetDir = subDir ? join(baseDir, subDir) : baseDir;
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}
function generateFileName(originalName) {
  const ext = extname(originalName);
  return `${Date.now()}-${randomUUID2()}${ext}`;
}
var uploadsRoutes = async (fastify) => {
  fastify.post(
    "/",
    { preHandler: authenticate },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "Kh\xF4ng c\xF3 t\u1EC7p n\xE0o \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn" });
      }
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: "Lo\u1EA1i t\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7",
          allowedTypes: ALLOWED_TYPES
        });
      }
      const isImage = ALLOWED_IMAGE_TYPES.includes(data.mimetype);
      const subDir = isImage ? "images" : "audio";
      const uploadDir = getUploadDir(subDir);
      const fileName = generateFileName(data.filename);
      const filePath = join(uploadDir, fileName);
      try {
        await pipeline(data.file, createWriteStream(filePath));
        const relativePath = `/uploads/${subDir}/${fileName}`;
        return {
          url: toFileUrl(relativePath),
          fileName,
          mimeType: data.mimetype,
          size: data.file.bytesRead
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "T\u1EA3i t\u1EC7p l\xEAn th\u1EA5t b\u1EA1i" });
      }
    }
  );
  fastify.post(
    "/image",
    { preHandler: authenticate },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "Kh\xF4ng c\xF3 t\u1EC7p n\xE0o \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn" });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: "Lo\u1EA1i h\xECnh \u1EA3nh kh\xF4ng h\u1EE3p l\u1EC7",
          allowedTypes: ALLOWED_IMAGE_TYPES
        });
      }
      const uploadDir = getUploadDir("images");
      const fileName = generateFileName(data.filename);
      const filePath = join(uploadDir, fileName);
      try {
        await pipeline(data.file, createWriteStream(filePath));
        return {
          url: toFileUrl(`/uploads/images/${fileName}`),
          fileName,
          mimeType: data.mimetype
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "T\u1EA3i t\u1EC7p l\xEAn th\u1EA5t b\u1EA1i" });
      }
    }
  );
  fastify.post(
    "/audio",
    { preHandler: authenticate },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "Kh\xF4ng c\xF3 t\u1EC7p n\xE0o \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn" });
      }
      if (!ALLOWED_AUDIO_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: "Lo\u1EA1i \xE2m thanh kh\xF4ng h\u1EE3p l\u1EC7",
          allowedTypes: ALLOWED_AUDIO_TYPES
        });
      }
      const uploadDir = getUploadDir("audio");
      const fileName = generateFileName(data.filename);
      const filePath = join(uploadDir, fileName);
      try {
        await pipeline(data.file, createWriteStream(filePath));
        return {
          url: toFileUrl(`/uploads/audio/${fileName}`),
          fileName,
          mimeType: data.mimetype
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Failed to upload file" });
      }
    }
  );
  fastify.delete(
    "/",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { url } = request.body || {};
      if (!url || typeof url !== "string") {
        return reply.status(400).send({ error: "Y\xEAu c\u1EA7u URL t\u1EC7p c\u1EA7n x\xF3a" });
      }
      let decodedUrl;
      try {
        decodedUrl = decodeURIComponent(url);
        if (decodedUrl.includes("%")) {
          try {
            decodedUrl = decodeURIComponent(decodedUrl);
          } catch {
          }
        }
      } catch {
        return reply.status(400).send({ error: "URL kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      if (decodedUrl.includes("..") || decodedUrl.includes(":\\") || decodedUrl.includes(":/")) {
        return reply.status(400).send({ error: "\u0110\u01B0\u1EDDng d\u1EABn ch\u1EE9a k\xFD t\u1EF1 kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      const match = decodedUrl.match(/\/uploads\/(images|audio)\/(.+)/);
      if (!match) {
        return reply.status(400).send({ error: "URL t\u1EC7p kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng /uploads/(images|audio)/..." });
      }
      const [, subDir, rawFileName] = match;
      const baseUploadDir = join(process.cwd(), env.UPLOAD_DIR);
      const authService = new AuthorizationService(fastify.prisma);
      let filePath;
      try {
        filePath = authService.validateUploadPathBoundary({
          subDir,
          rawFileName,
          baseUploadDir
        });
      } catch (err) {
        const statusCode = err instanceof AuthorizationError ? err.statusCode : 400;
        return reply.status(statusCode).send({ error: err.message || "T\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          return { success: true, message: "\u0110\xE3 x\xF3a t\u1EC7p th\xE0nh c\xF4ng" };
        } else {
          return reply.status(404).send({ error: "Kh\xF4ng t\xECm th\u1EA5y t\u1EC7p" });
        }
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "X\xF3a t\u1EC7p th\u1EA5t b\u1EA1i" });
      }
    }
  );
};
var uploads_routes_default = uploadsRoutes;

// server/routes/logs.routes.ts
import { readFileSync, existsSync as existsSync2 } from "fs";
import { join as join2 } from "path";
var logsRoutes = async (fastify) => {
  fastify.get(
    "/log-viewer",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const logFile = join2(process.cwd(), "logs/app.log");
      if (!existsSync2(logFile)) {
        return reply.status(404).send({ error: "Log file not found" });
      }
      try {
        const content = readFileSync(logFile, "utf-8");
        return reply.type("text/plain").send(content);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Failed to read log file" });
      }
    }
  );
  fastify.get(
    "/log-viewer/last",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { lines = "100" } = request.query;
      const n = parseInt(lines);
      const logFile = join2(process.cwd(), "logs/app.log");
      if (!existsSync2(logFile)) {
        return reply.status(404).send({ error: "Log file not found" });
      }
      try {
        const content = readFileSync(logFile, "utf-8");
        const allLines = content.split("\n");
        const lastLines = allLines.slice(-n).join("\n");
        return reply.type("text/plain").send(lastLines);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Failed to read log file" });
      }
    }
  );
};
var logs_routes_default = logsRoutes;

// server/repositories/class.repository.ts
var ClassRepository = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async findById(id, include) {
    return this.prisma.class.findUnique({
      where: { id },
      include: include || {
        course: true,
        teacher: {
          select: { id: true, fullName: true, email: true }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { joinedAt: "desc" }
        }
      }
    });
  }
  async findMany(where, skip, take, orderBy) {
    return this.prisma.class.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
      include: {
        teacher: {
          select: { id: true, fullName: true, email: true }
        },
        _count: {
          select: { students: true }
        }
      }
    });
  }
  async count(where) {
    return this.prisma.class.count({ where });
  }
  async create(data) {
    return this.prisma.class.create({ data });
  }
  async update(id, data) {
    return this.prisma.class.update({
      where: { id },
      data
    });
  }
  async delete(id) {
    return this.prisma.class.delete({
      where: { id }
    });
  }
  async isTeacherOfClass(classId, teacherId) {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, teacherId }
    });
    return !!cls;
  }
  async isStudentInClass(classId, studentId) {
    const cs = await this.prisma.classStudent.findFirst({
      where: { classId, studentId }
    });
    return !!cs;
  }
  async addStudent(classId, studentId) {
    return this.prisma.classStudent.create({
      data: { classId, studentId }
    });
  }
  async addStudentToClass(classId, studentId) {
    return this.addStudent(classId, studentId);
  }
  async removeStudent(classId, studentId) {
    return this.prisma.classStudent.deleteMany({
      where: { classId, studentId }
    });
  }
  async removeStudentFromClass(classId, studentId) {
    return this.removeStudent(classId, studentId);
  }
  async getClassesForStudent(studentId) {
    return this.prisma.classStudent.findMany({
      where: {
        studentId
      },
      include: {
        class: {
          include: {
            course: {
              select: { id: true, title: true, description: true }
            },
            teacher: {
              select: { id: true, fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }
  async recordAttendance(data) {
    return this.prisma.classAttendance.upsert({
      where: {
        classId_studentId_sessionDate: {
          classId: data.classId,
          studentId: data.studentId,
          sessionDate: data.sessionDate
        }
      },
      update: {
        status: data.status,
        markedBy: data.markedBy,
        note: data.note
      },
      create: {
        classId: data.classId,
        studentId: data.studentId,
        sessionDate: data.sessionDate,
        markedBy: data.markedBy,
        status: data.status,
        note: data.note
      }
    });
  }
};

// server/services/class.service.ts
var ClassService = class {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new ClassRepository(prisma);
  }
  repo;
  // Use Case: Get all active class memberships for the currently authenticated student
  async getMyClasses(userId) {
    const memberships = await this.repo.getClassesForStudent(userId);
    return memberships.map((m) => ({
      id: m.id,
      classId: m.class.id,
      className: m.class.name,
      courseId: m.class.courseId,
      courseTitle: m.class.course?.title ?? m.class.name,
      teacherName: m.class.teacher?.fullName ?? null,
      isActive: m.class.isActive,
      membershipStatus: "ACTIVE",
      joinedAt: m.createdAt
    }));
  }
  // Use Case: List Classes with Role & Teacher filtering
  async listClasses(user, query) {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;
    const where = {};
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (isTeacher && !isAdmin) {
      where.teacherId = user.id;
    } else if (!isAdmin && !isTeacher) {
      where.students = { some: { studentId: user.id } };
    }
    if (isActive !== void 0) {
      where.isActive = isActive === "true" || isActive === true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    const [data, total] = await Promise.all([
      this.repo.findMany(where, skip, limit),
      this.repo.count(where)
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  // Use Case: Get Class Details with Ownership Check
  async getClassById(user, id) {
    const classData = await this.repo.findById(id);
    if (!classData) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y l\u1EDBp h\u1ECDc");
    }
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (isTeacher && !isAdmin && classData.teacherId !== user.id) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - l\u1EDBp kh\xF4ng thu\u1ED9c quy\u1EC1n qu\u1EA3n l\xFD c\u1EE7a b\u1EA1n", 403);
    }
    if (!isAdmin && !isTeacher) {
      const isEnrolled = classData.students.some((s) => s.studentId === user.id);
      if (!isEnrolled) {
        throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - b\u1EA1n kh\xF4ng ph\u1EA3i th\xE0nh vi\xEAn c\u1EE7a l\u1EDBp n\xE0y", 403);
      }
    }
    return classData;
  }
  // Use Case: Create Class (Admin or Teacher)
  async createClass(user, data) {
    const isAdmin = user.roles.includes("admin");
    const isTeacher = user.roles.includes("teacher");
    if (!isAdmin && !isTeacher) {
      throw new AuthorizationError("Ch\u1EC9 gi\xE1o vi\xEAn ho\u1EB7c admin m\u1EDBi c\xF3 quy\u1EC1n t\u1EA1o l\u1EDBp", 403);
    }
    const teacherId = isAdmin ? data.teacherId || user.id : user.id;
    let courseId = data.courseId;
    if (!courseId) {
      const firstCourse = await this.prisma.course.findFirst();
      courseId = firstCourse?.id || "default";
    }
    return this.repo.create({
      name: data.name,
      description: data.description,
      course: { connect: { id: courseId } },
      teacher: teacherId ? { connect: { id: teacherId } } : void 0,
      startDate: data.startDate ? new Date(data.startDate) : void 0,
      endDate: data.endDate ? new Date(data.endDate) : void 0,
      isActive: data.isActive !== void 0 ? data.isActive : true
    });
  }
  // Use Case: Update Class with Ownership Guard
  async updateClass(user, id, data) {
    const classData = await this.repo.findById(id);
    if (!classData) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y l\u1EDBp h\u1ECDc");
    }
    const isAdmin = user.roles.includes("admin");
    if (!isAdmin && classData.teacherId !== user.id) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - b\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n s\u1EEDa l\u1EDBp n\xE0y", 403);
    }
    const updatePayload = {};
    if (data.name !== void 0) updatePayload.name = data.name;
    if (data.description !== void 0) updatePayload.description = data.description;
    if (data.startDate !== void 0) updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== void 0) updatePayload.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.isActive !== void 0) updatePayload.isActive = data.isActive;
    if (isAdmin && data.teacherId !== void 0) updatePayload.teacherId = data.teacherId;
    return this.repo.update(id, updatePayload);
  }
  // Use Case: Add Student to Class
  async addStudent(user, classId, studentId) {
    const classData = await this.repo.findById(classId);
    if (!classData) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y l\u1EDBp h\u1ECDc");
    }
    const isAdmin = user.roles.includes("admin");
    if (!isAdmin && classData.teacherId !== user.id) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - b\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n th\xEAm h\u1ECDc vi\xEAn v\xE0o l\u1EDBp n\xE0y", 403);
    }
    const alreadyIn = await this.repo.isStudentInClass(classId, studentId);
    if (alreadyIn) {
      throw new AuthorizationError("H\u1ECDc vi\xEAn \u0111\xE3 c\xF3 trong l\u1EDBp h\u1ECDc n\xE0y", 409);
    }
    return this.repo.addStudentToClass(classId, studentId);
  }
  // Use Case: Remove Student from Class
  async removeStudent(user, classId, studentId) {
    const classData = await this.repo.findById(classId);
    if (!classData) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y l\u1EDBp h\u1ECDc");
    }
    const isAdmin = user.roles.includes("admin");
    if (!isAdmin && classData.teacherId !== user.id) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - b\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n x\xF3a h\u1ECDc vi\xEAn kh\u1ECFi l\u1EDBp n\xE0y", 403);
    }
    return this.repo.removeStudentFromClass(classId, studentId);
  }
  // Use Case: Record Attendance
  async recordAttendance(user, classId, records) {
    const classData = await this.repo.findById(classId);
    if (!classData) {
      throw new NotFoundError("Kh\xF4ng t\xECm th\u1EA5y l\u1EDBp h\u1ECDc");
    }
    const isAdmin = user.roles.includes("admin");
    if (!isAdmin && classData.teacherId !== user.id) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp - b\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n \u0111i\u1EC3m danh l\u1EDBp n\xE0y", 403);
    }
    const results = [];
    for (const r of records) {
      const sDate = r.sessionDate ? new Date(r.sessionDate) : /* @__PURE__ */ new Date();
      const recorded = await this.repo.recordAttendance({
        classId,
        studentId: r.studentId,
        sessionDate: sDate,
        markedBy: user.id,
        status: r.status,
        note: r.note
      });
      results.push(recorded);
    }
    return { success: true, count: results.length, data: results };
  }
};

// server/schemas/class.schema.ts
import { z as z8 } from "zod";
var createClassSchema = z8.object({
  name: z8.string().min(1, "T\xEAn l\u1EDBp kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng"),
  description: z8.string().optional().default(""),
  courseId: z8.string().optional(),
  teacherId: z8.string().optional(),
  startDate: z8.string().optional(),
  endDate: z8.string().optional(),
  isActive: z8.boolean().optional().default(true)
});
var updateClassSchema = z8.object({
  name: z8.string().min(1).optional(),
  description: z8.string().optional(),
  courseId: z8.string().optional(),
  teacherId: z8.string().optional(),
  startDate: z8.string().nullable().optional(),
  endDate: z8.string().nullable().optional(),
  isActive: z8.boolean().optional()
});

// server/controllers/class.controller.ts
var ClassController = class {
  service;
  constructor(fastify) {
    this.service = new ClassService(fastify.prisma);
  }
  async getMyClasses(request, reply) {
    try {
      const user = request.user;
      const result = await this.service.getMyClasses(user.id);
      return reply.send({ data: result });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async list(request, reply) {
    const dataQuery = handleValidation(
      paginationSchema.safeParse(request.query),
      request,
      reply
    );
    if (!dataQuery) return;
    try {
      const user = request.user;
      const result = await this.service.listClasses(user, {
        ...dataQuery,
        ...request.query
      });
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async getById(request, reply) {
    try {
      const user = request.user;
      const classData = await this.service.getClassById(user, request.params.id);
      return reply.send(classData);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async create(request, reply) {
    const parsed = createClassSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
        details: parsed.error.flatten()
      });
    }
    try {
      const user = request.user;
      const result = await this.service.createClass(user, parsed.data);
      return reply.status(201).send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async update(request, reply) {
    const parsed = updateClassSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
        details: parsed.error.flatten()
      });
    }
    try {
      const user = request.user;
      const result = await this.service.updateClass(user, request.params.id, parsed.data);
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async addStudent(request, reply) {
    try {
      const user = request.user;
      const { studentId } = request.body || {};
      if (!studentId) {
        return reply.status(400).send({ error: "studentId l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const result = await this.service.addStudent(user, request.params.id, studentId);
      return reply.status(201).send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async removeStudent(request, reply) {
    try {
      const user = request.user;
      await this.service.removeStudent(user, request.params.id, request.params.studentId);
      return reply.send({ success: true });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
  async recordAttendance(request, reply) {
    try {
      const user = request.user;
      const { records = [] } = request.body || {};
      const result = await this.service.recordAttendance(user, request.params.id, records);
      return reply.send(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  }
};

// server/routes/classes.routes.ts
async function classesRoutes(fastify) {
  const controller = new ClassController(fastify);
  fastify.get("/my-classes", { preHandler: authenticate }, async (request, reply) => {
    return controller.getMyClasses(request, reply);
  });
  fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
    return controller.list(request, reply);
  });
  fastify.get("/:id", { preHandler: authenticate }, async (request, reply) => {
    return controller.getById(request, reply);
  });
  fastify.post(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.create(request, reply);
    }
  );
  fastify.put(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.update(request, reply);
    }
  );
  fastify.post(
    "/:id/students",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.addStudent(request, reply);
    }
  );
  fastify.delete(
    "/:id/students/:studentId",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      return controller.removeStudent(request, reply);
    }
  );
}

// server/routes/highlights.routes.ts
import { z as z9 } from "zod";
var createHighlightSchema = z9.object({
  sectionId: z9.string().min(1),
  passageId: z9.string().optional(),
  highlightText: z9.string().optional(),
  startIndex: z9.number().int().nonnegative(),
  endIndex: z9.number().int().positive(),
  color: z9.enum(["yellow", "green"]).optional()
});
var updateHighlightSchema = z9.object({
  color: z9.enum(["yellow", "green"]).optional()
});
var highlightsRoutes = async (fastify) => {
  fastify.get(
    "/",
    { preHandler: authenticate },
    async (request, reply) => {
      const { sectionId } = request.query;
      const studentId = request.user.id;
      if (!sectionId) {
        return reply.status(400).send({ error: "sectionId l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const highlights = await fastify.prisma.highlight.findMany({
        where: {
          sectionId,
          studentId
        },
        orderBy: {
          createdAt: "asc"
        }
      });
      return { data: highlights };
    }
  );
  fastify.post("/", { preHandler: authenticate }, async (request, reply) => {
    const studentId = request.user.id;
    const parsed = createHighlightSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "D\u1EEF li\u1EC7u highlight kh\xF4ng h\u1EE3p l\u1EC7" });
    }
    const {
      sectionId,
      passageId,
      highlightText,
      startIndex,
      endIndex,
      color
    } = parsed.data;
    if (endIndex <= startIndex) {
      return reply.status(400).send({ error: "Kho\u1EA3ng highlight kh\xF4ng h\u1EE3p l\u1EC7 (endIndex <= startIndex)" });
    }
    const highlight = await fastify.prisma.highlight.create({
      data: {
        sectionId,
        passageId: passageId || null,
        studentId,
        highlightText: highlightText || null,
        startIndex,
        endIndex,
        color: color || "yellow"
      }
    });
    return highlight;
  });
  fastify.patch(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const studentId = request.user.id;
      const parsed = updateHighlightSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "D\u1EEF li\u1EC7u c\u1EADp nh\u1EADt kh\xF4ng h\u1EE3p l\u1EC7" });
      }
      if (!parsed.data.color) {
        return reply.status(400).send({ error: "C\u1EA7n \xEDt nh\u1EA5t 1 tr\u01B0\u1EDDng \u0111\u1EC3 c\u1EADp nh\u1EADt" });
      }
      const existing = await fastify.prisma.highlight.findFirst({
        where: { id, studentId }
      });
      if (!existing) {
        return reply.status(404).send({ error: "Highlight kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c kh\xF4ng c\xF3 quy\u1EC1n s\u1EEDa" });
      }
      const updated = await fastify.prisma.highlight.update({
        where: { id },
        data: {
          ...parsed.data.color && { color: parsed.data.color }
        }
      });
      return updated;
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const studentId = request.user.id;
      try {
        const deleted = await fastify.prisma.highlight.deleteMany({
          where: {
            id,
            studentId
            // Ensure user can only delete their own highlights
          }
        });
        if (deleted.count === 0) {
          return reply.status(404).send({ error: "Ghi ch\xFA kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c kh\xF4ng c\xF3 quy\u1EC1n x\xF3a" });
        }
        return { success: true };
      } catch (error) {
        return reply.status(404).send({ error: "Ghi ch\xFA kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c kh\xF4ng c\xF3 quy\u1EC1n x\xF3a" });
      }
    }
  );
};
var highlights_routes_default = highlightsRoutes;

// server/routes/attendance.routes.ts
import crypto2 from "node:crypto";
import { z as z10 } from "zod";

// server/services/attendance.service.ts
var ClassSessionStatus = {
  SCHEDULED: "SCHEDULED",
  PLANNED: "PLANNED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};
var AttendanceService = class {
  constructor(prisma) {
    this.prisma = prisma;
    this.classRepo = new ClassRepository(prisma);
    this.authService = new AuthorizationService(prisma);
  }
  classRepo;
  authService;
  // 1. Fetch Session Attendance & Summary Projection (Object-Level Authorization)
  async getSessionAttendance(classId, sessionId, userId, userRoles = ["student"]) {
    const classData = await this.classRepo.findById(classId);
    if (!classData) throw new NotFoundError("L\u1EDBp h\u1ECDc kh\xF4ng t\u1ED3n t\u1EA1i.");
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId }
    });
    if (!session || session.classId !== classId) throw new NotFoundError("Bu\u1ED5i h\u1ECDc kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c kh\xF4ng thu\u1ED9c l\u1EDBp n\xE0y.");
    const isAdmin = userRoles.includes("admin");
    const isClassTeacher = userRoles.includes("teacher") && classData.teacherId === userId;
    const isOtherTeacher = userRoles.includes("teacher") && classData.teacherId !== userId;
    if (isOtherTeacher && !isAdmin) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp: B\u1EA1n kh\xF4ng ph\u1EA3i gi\xE1o vi\xEAn ph\u1EE5 tr\xE1ch l\u1EDBp h\u1ECDc n\xE0y.", 403);
    }
    const isStudent = !isAdmin && !isClassTeacher;
    if (isStudent) {
      const isEnrolled = await this.authService.isStudentEnrolledInClass(userId, classId);
      if (!isEnrolled) {
        throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp: B\u1EA1n kh\xF4ng thu\u1ED9c danh s\xE1ch h\u1ECDc vi\xEAn c\u1EE7a l\u1EDBp n\xE0y.", 403);
      }
      const studentRecord = await this.prisma.classAttendance.findUnique({
        where: {
          classId_studentId_sessionDate: {
            classId,
            studentId: userId,
            sessionDate: session.plannedDate
          }
        },
        include: {
          student: {
            select: { id: true, fullName: true, email: true, avatarUrl: true }
          }
        }
      });
      const studentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, avatarUrl: true }
      });
      return {
        classId,
        className: classData.name,
        sessionId,
        sessionNumber: session.sessionNumber,
        sessionTitle: `Bu\u1ED5i ${session.sessionNumber}`,
        sessionDate: session.plannedDate,
        status: session.status,
        summary: null,
        // Students do not get whole class summary
        students: [
          {
            studentId: userId,
            studentName: studentUser?.fullName || studentUser?.email || "",
            avatarUrl: studentUser?.avatarUrl || null,
            status: studentRecord ? studentRecord.status : "UNMARKED",
            note: studentRecord?.note || null
          }
        ]
      };
    }
    const classStudents = await this.prisma.classStudent.findMany({
      where: { classId, deletedAt: null },
      include: { student: true }
    });
    const attendanceRecords = await this.prisma.classAttendance.findMany({
      where: {
        classId,
        sessionDate: session.plannedDate
      }
    });
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;
    const studentsAttendance = classStudents.map((cs) => {
      const record = attendanceRecords.find((r) => r.studentId === cs.studentId);
      const status = record ? record.status : "UNMARKED";
      if (status === "PRESENT") presentCount++;
      else if (status === "ABSENT") absentCount++;
      else if (status === "LATE") lateCount++;
      else if (status === "EXCUSED") excusedCount++;
      else unmarkedCount++;
      return {
        studentId: cs.studentId,
        studentName: cs.student.fullName || cs.student.email,
        avatarUrl: cs.student.avatarUrl,
        status,
        note: record?.note || null
      };
    });
    return {
      classId,
      className: classData.name,
      sessionId,
      sessionNumber: session.sessionNumber,
      sessionTitle: `Bu\u1ED5i ${session.sessionNumber}`,
      sessionDate: session.plannedDate,
      status: session.status,
      summary: {
        total: classStudents.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        unmarked: unmarkedCount
      },
      students: studentsAttendance
    };
  }
  // 2. Mark Session Attendance (Bulk Upsert Transaction + Strict Authorization Guard + Read-only Guard for COMPLETED sessions)
  async markSessionAttendance(classId, sessionId, teacherId, userRoles, items) {
    await this.authService.requireClassTeacherOrAdmin({
      userId: teacherId,
      userRoles,
      classId
    });
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session || session.classId !== classId) throw new NotFoundError("Bu\u1ED5i h\u1ECDc kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c kh\xF4ng thu\u1ED9c l\u1EDBp n\xE0y.");
    const isAdmin = userRoles.includes("admin");
    if (session.status === ClassSessionStatus.COMPLETED && !isAdmin) {
      throw new AuthorizationError(
        "SESSION_ALREADY_COMPLETED: Bu\u1ED5i h\u1ECDc \u0111\xE3 ch\u1ED1t \u0111i\u1EC3m danh (COMPLETED). B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa ngo\u1EA1i tr\u1EEB Admin.",
        403
      );
    }
    const requestedStudentIds = [...new Set(items.map((i) => i.studentId))];
    const activeClassStudents = await this.prisma.classStudent.findMany({
      where: {
        classId,
        studentId: { in: requestedStudentIds },
        deletedAt: null
      },
      select: { studentId: true }
    });
    const activeSet = new Set(activeClassStudents.map((cs) => cs.studentId));
    const invalidStudentIds = requestedStudentIds.filter((id) => !activeSet.has(id));
    if (invalidStudentIds.length > 0) {
      throw new AuthorizationError(
        `INVALID_ENROLLMENT_STUDENT: Ph\xE1t hi\u1EC7n h\u1ECDc vi\xEAn (${invalidStudentIds.join(", ")}) kh\xF4ng thu\u1ED9c danh s\xE1ch h\u1ECDc vi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng c\u1EE7a l\u1EDBp h\u1ECDc n\xE0y.`,
        400
      );
    }
    await this.prisma.$transaction(
      items.map((item) => {
        const itemNote = item.note || item.notes || null;
        return this.prisma.classAttendance.upsert({
          where: {
            classId_studentId_sessionDate: {
              classId,
              studentId: item.studentId,
              sessionDate: session.plannedDate
            }
          },
          update: {
            status: item.status,
            markedBy: teacherId,
            note: itemNote
          },
          create: {
            classId,
            studentId: item.studentId,
            sessionDate: session.plannedDate,
            markedBy: teacherId,
            status: item.status,
            note: itemNote
          }
        });
      })
    );
    return { success: true, message: `\u0110\xE3 l\u01B0u \u0111i\u1EC3m danh cho ${items.length} h\u1ECDc vi\xEAn.` };
  }
  // 3. Complete Session Guard: Chốt buổi học (Khóa 100% điểm danh)
  async completeSession(classId, sessionId, userId, userRoles) {
    await this.authService.requireClassTeacherOrAdmin({
      userId,
      userRoles,
      classId
    });
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session || session.classId !== classId) throw new NotFoundError("Bu\u1ED5i h\u1ECDc kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c kh\xF4ng thu\u1ED9c l\u1EDBp n\xE0y.");
    const activeStudents = await this.prisma.classStudent.findMany({
      where: { classId, deletedAt: null },
      select: { studentId: true }
    });
    const attendanceRecords = await this.prisma.classAttendance.findMany({
      where: {
        classId,
        sessionDate: session.plannedDate
      }
    });
    const unmarkedStudentIds = activeStudents.map((s) => s.studentId).filter((studentId) => {
      const record = attendanceRecords.find((r) => r.studentId === studentId);
      return !record || record.status === "UNMARKED";
    });
    if (unmarkedStudentIds.length > 0) {
      throw new AuthorizationError(
        `COMPLETION_GUARD_FAILED: C\xF2n ${unmarkedStudentIds.length} h\u1ECDc vi\xEAn ch\u01B0a \u0111\u01B0\u1EE3c \u0111i\u1EC3m danh (tr\u1EA1ng th\xE1i UNMARKED). B\u1EA1n ph\u1EA3i \u0111i\u1EC3m danh 100% h\u1ECDc vi\xEAn tr\u01B0\u1EDBc khi ho\xE0n th\xE0nh bu\u1ED5i h\u1ECDc.`,
        400
      );
    }
    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: ClassSessionStatus.COMPLETED
      }
    });
    return {
      success: true,
      message: "\u0110\xE3 ho\xE0n t\u1EA5t ch\u1ED1t bu\u1ED5i h\u1ECDc th\xE0nh c\xF4ng. Tr\u1EA1ng th\xE1i \u0111i\u1EC3m danh \u0111\xE3 \u0111\u01B0\u1EE3c kh\xF3a.",
      session: {
        id: updated.id,
        sessionNumber: updated.sessionNumber,
        status: updated.status
      }
    };
  }
  // 4. Attendance Matrix Projection
  async getAttendanceMatrix(classId, userId, userRoles = ["student"]) {
    const classData = await this.classRepo.findById(classId);
    if (!classData) throw new NotFoundError("L\u1EDBp h\u1ECDc kh\xF4ng t\u1ED3n t\u1EA1i.");
    const isAdmin = userRoles.includes("admin");
    const isClassTeacher = userRoles.includes("teacher") && classData.teacherId === userId;
    const isOtherTeacher = userRoles.includes("teacher") && classData.teacherId !== userId;
    if (isOtherTeacher && !isAdmin) {
      throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp: B\u1EA1n kh\xF4ng ph\u1EA3i gi\xE1o vi\xEAn ph\u1EE5 tr\xE1ch l\u1EDBp h\u1ECDc n\xE0y.", 403);
    }
    const isStudent = !isAdmin && !isClassTeacher;
    if (isStudent) {
      const isEnrolled = await this.authService.isStudentEnrolledInClass(userId, classId);
      if (!isEnrolled) {
        throw new AuthorizationError("T\u1EEB ch\u1ED1i truy c\u1EADp: B\u1EA1n kh\xF4ng thu\u1ED9c danh s\xE1ch h\u1ECDc vi\xEAn c\u1EE7a l\u1EDBp n\xE0y.", 403);
      }
    }
    const sessions = await this.prisma.classSession.findMany({
      where: { classId },
      orderBy: { sessionNumber: "asc" }
    });
    const classStudents = await this.prisma.classStudent.findMany({
      where: {
        classId,
        deletedAt: null,
        ...isStudent ? { studentId: userId } : {}
      },
      include: { student: true },
      orderBy: { joinedAt: "asc" }
    });
    const allAttendance = await this.prisma.classAttendance.findMany({
      where: {
        classId,
        ...isStudent ? { studentId: userId } : {}
      }
    });
    const completedSessions = sessions.filter((s) => s.status === ClassSessionStatus.COMPLETED);
    const today = /* @__PURE__ */ new Date();
    today.setHours(23, 59, 59, 999);
    const matrix = classStudents.map((cs) => {
      const studentId = cs.studentId;
      const studentAttendance = allAttendance.filter((a) => a.studentId === studentId);
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;
      sessions.forEach((s) => {
        const att = studentAttendance.find(
          (a) => new Date(a.sessionDate).toISOString().slice(0, 10) === new Date(s.plannedDate).toISOString().slice(0, 10)
        );
        if (s.status === ClassSessionStatus.COMPLETED && att) {
          if (att.status === "PRESENT") presentCount++;
          else if (att.status === "LATE") lateCount++;
          else if (att.status === "ABSENT") absentCount++;
          else if (att.status === "EXCUSED") excusedCount++;
        }
      });
      const eligibleSessions = Math.max(0, completedSessions.length - excusedCount);
      const attendedCount = presentCount + lateCount;
      const attendanceRate = eligibleSessions > 0 ? Math.round(attendedCount / eligibleSessions * 1e3) / 10 : 100;
      const sessionRecords = sessions.map((s) => {
        const att = studentAttendance.find(
          (a) => new Date(a.sessionDate).toISOString().slice(0, 10) === new Date(s.plannedDate).toISOString().slice(0, 10)
        );
        const sDate = new Date(s.plannedDate);
        const isFuture = s.status === "SCHEDULED" && sDate > today;
        const isOverdueUnmarked = s.status === "SCHEDULED" && sDate <= today;
        return {
          sessionId: s.id,
          sessionNumber: s.sessionNumber,
          sessionDate: s.plannedDate,
          status: s.status,
          attendanceStatus: att ? att.status : "UNMARKED",
          isFuture,
          isOverdueUnmarked,
          note: att?.note || null
        };
      });
      return {
        studentId,
        studentName: cs.student.fullName || cs.student.email,
        avatarUrl: cs.student.avatarUrl,
        email: cs.student.email,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        eligibleSessions,
        attendanceRate,
        sessions: sessionRecords
      };
    });
    const sessionCoverage = sessions.length > 0 ? Math.round(completedSessions.length / sessions.length * 1e3) / 10 : 0;
    const totalExpectedRecords = completedSessions.length * classStudents.length;
    const actualMarkedRecords = allAttendance.filter((a) => {
      const isCompletedDate = completedSessions.some(
        (cs) => new Date(cs.plannedDate).toISOString().slice(0, 10) === new Date(a.sessionDate).toISOString().slice(0, 10)
      );
      return isCompletedDate && a.status !== "UNMARKED";
    }).length;
    const recordCoverage = totalExpectedRecords > 0 ? Math.round(actualMarkedRecords / totalExpectedRecords * 1e3) / 10 : 100;
    return {
      classId,
      className: classData.name,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      sessionCoverage,
      recordCoverage,
      attendanceCoverage: sessionCoverage,
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        sessionDate: s.plannedDate,
        title: s.note || `Bu\u1ED5i ${s.sessionNumber}`,
        lessonTitle: s.note || `Bu\u1ED5i ${s.sessionNumber}`,
        status: s.status
      })),
      students: matrix
    };
  }
};

// server/routes/attendance.routes.ts
var markAttendanceSchema = z10.object({
  items: z10.array(
    z10.object({
      studentId: z10.string().uuid(),
      status: z10.enum(["UNMARKED", "PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      note: z10.string().optional().nullable(),
      notes: z10.string().optional().nullable()
    })
  )
});
var attendanceRoutes = async (fastify) => {
  const prisma = fastify.prisma;
  const attendanceService = new AttendanceService(prisma);
  const authService = new AuthorizationService(prisma);
  fastify.get(
    "/classes/:classId/sessions/:sessionId/attendance",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user;
      const { classId, sessionId } = request.params;
      try {
        const data = await attendanceService.getSessionAttendance(
          classId,
          sessionId,
          user.id,
          user.roles || ["student"]
        );
        return reply.send({ success: true, data });
      } catch (err) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    }
  );
  fastify.post(
    "/classes/:classId/sessions/:sessionId/attendance",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
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
      } catch (err) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode) {
          const isCompletedErr = err.message?.includes("SESSION_ALREADY_COMPLETED");
          const isInvalidEnrollment = err.message?.includes("INVALID_ENROLLMENT_STUDENT");
          if (isCompletedErr) {
            return reply.status(403).send({
              error: "SESSION_ALREADY_COMPLETED",
              message: err.message
            });
          }
          if (isInvalidEnrollment) {
            return reply.status(400).send({
              error: "INVALID_ENROLLMENT_STUDENT",
              message: err.message
            });
          }
          return reply.status(err.statusCode || 403).send({
            error: err.message,
            message: err.message
          });
        }
        throw err;
      }
    }
  );
  fastify.post(
    "/classes/:classId/sessions/:sessionId/complete",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
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
      } catch (err) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        if (err.message && err.message.includes("ch\u01B0a \u0111\u01B0\u1EE3c \u0111i\u1EC3m danh")) {
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    }
  );
  fastify.get(
    "/classes/:classId/attendance-matrix",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user;
      const { classId } = request.params;
      try {
        const data = await attendanceService.getAttendanceMatrix(
          classId,
          user.id,
          user.roles || ["student"]
        );
        return reply.send({ success: true, data });
      } catch (err) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    }
  );
  fastify.get(
    "/classes/:classId/sessions",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { classId } = request.params;
      const sessions = await prisma.classSession.findMany({
        where: { classId },
        orderBy: { sessionNumber: "asc" },
        include: { lesson: true }
      });
      const mapped = sessions.map((s) => ({
        id: s.id,
        classId: s.classId,
        sessionNumber: s.sessionNumber,
        title: s.title || s.lesson?.title || `Bu\u1ED5i ${s.sessionNumber}`,
        sessionDate: s.sessionDate,
        plannedDate: s.sessionDate,
        startTime: s.startTime || null,
        endTime: s.endTime || null,
        status: s.status,
        note: s.notes || null,
        rescheduleReason: null,
        completedAt: s.completedAt || null
      }));
      return reply.send(mapped);
    }
  );
  fastify.post(
    "/classes/:classId/sessions/:sessionId/unlock",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const user = request.user;
      const { classId, sessionId } = request.params;
      try {
        await authService.requireClassTeacherOrAdmin({
          userId: user.id,
          userRoles: user.roles || [],
          classId
        });
        const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
        if (!session || session.classId !== classId) {
          return reply.status(404).send({ error: "Bu\u1ED5i h\u1ECDc kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c kh\xF4ng thu\u1ED9c l\u1EDBp n\xE0y." });
        }
        await prisma.classSession.update({
          where: { id: sessionId },
          data: {
            status: "SCHEDULED",
            completedAt: null,
            completedBy: null
          }
        });
        return reply.send({ success: true, message: "\u0110\xE3 m\u1EDF l\u1EA1i \u0111i\u1EC3m danh bu\u1ED5i h\u1ECDc th\xE0nh c\xF4ng." });
      } catch (err) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    }
  );
  fastify.post(
    "/classes/:classId/sessions/generate",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const user = request.user;
      const { classId } = request.params;
      const { startDate, weekdays = [1, 3, 5], totalSessions = 24, startTime = "18:00", endTime = "20:00" } = request.body || {};
      try {
        const cls = await authService.requireClassTeacherOrAdmin({
          userId: user.id,
          userRoles: user.roles || [],
          classId
        });
        const lessons = await prisma.lesson.findMany({
          where: { courseId: cls.courseId },
          orderBy: { lessonOrder: "asc" }
        });
        const dates = [];
        const [y, m, d] = (startDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)).split("-").map(Number);
        const cur = new Date(y, m - 1, d);
        while (dates.length < totalSessions) {
          const dow = cur.getDay();
          if (weekdays.includes(dow)) {
            const mm = String(cur.getMonth() + 1).padStart(2, "0");
            const dd = String(cur.getDate()).padStart(2, "0");
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
              id: crypto2.randomUUID(),
              classId,
              lessonId: lesson?.id || "default-lesson-id",
              sessionNumber: sessionNum,
              title,
              sessionDate,
              status: "SCHEDULED"
            }
          });
          createdSessions.push({
            id: sess.id,
            sessionNumber: sessionNum,
            sessionDate: dates[i],
            title,
            status: "SCHEDULED"
          });
        }
        return reply.send(createdSessions);
      } catch (err) {
        if (err instanceof NotFoundError || err.statusCode === 404) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof AuthorizationError || err.statusCode === 403) {
          return reply.status(err.statusCode || 403).send({ error: err.message });
        }
        throw err;
      }
    }
  );
};
var attendance_routes_default = attendanceRoutes;

// server/routes/site-settings.routes.ts
import { z as z11 } from "zod";
var SETTINGS_KEY = "global";
var updateSiteSettingsSchema = z11.object({
  id: z11.string().optional(),
  siteName: z11.string().max(255).optional(),
  logoUrl: z11.string().max(5e3).nullable().optional(),
  zaloLink: z11.string().max(500).nullable().optional(),
  completedLessonsStat: z11.string().max(50).nullable().optional(),
  authTagline: z11.string().max(120).optional(),
  authFeatureOneTitle: z11.string().max(120).optional(),
  authFeatureOneDescription: z11.string().max(160).optional(),
  authFeatureTwoTitle: z11.string().max(120).optional(),
  authFeatureTwoDescription: z11.string().max(160).optional(),
  highlightPresent: z11.string().max(20).optional(),
  highlightAbsent: z11.string().max(20).optional(),
  highlightInactive: z11.string().max(20).optional(),
  sloganText: z11.string().max(100).optional(),
  sloganFontFamily: z11.string().max(191).optional(),
  sloganFontWeight: z11.enum(["light", "regular", "bold"]).optional(),
  sloganDesktopSize: z11.number().int().min(20).max(96).optional(),
  sloganMobileSize: z11.number().int().min(14).max(72).optional(),
  sloganColor: z11.string().max(20).optional(),
  sloganAlign: z11.enum(["left", "center", "right"]).optional(),
  sloganLineHeight: z11.number().min(1).max(2).optional(),
  heroDescriptionText: z11.string().max(300).optional(),
  heroDescriptionFontFamily: z11.string().max(191).optional(),
  heroDescriptionFontWeight: z11.enum(["light", "regular", "bold"]).optional(),
  heroDescriptionDesktopSize: z11.number().int().min(14).max(56).optional(),
  heroDescriptionMobileSize: z11.number().int().min(12).max(40).optional(),
  heroDescriptionColor: z11.string().max(20).optional(),
  heroDescriptionAlign: z11.enum(["left", "center", "right"]).optional(),
  heroDescriptionLineHeight: z11.number().min(1).max(2.2).optional(),
  updatedBy: z11.string().optional(),
  updatedAt: z11.union([z11.string(), z11.date()]).optional(),
  createdAt: z11.union([z11.string(), z11.date()]).optional()
}).strict({
  message: "D\u1EEF li\u1EC7u g\u1EEDi l\xEAn ch\u1EE9a tr\u01B0\u1EDDng c\xE0i \u0111\u1EB7t kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3"
});
function normalizeSettings(record) {
  const val = record && typeof record.value === "object" && record.value !== null ? record.value : record || {};
  return {
    id: record?.id || "global",
    siteName: val.siteName || "NextBand",
    logoUrl: val.logoUrl || "",
    zaloLink: val.zaloLink || "https://zalo.me",
    completedLessonsStat: val.completedLessonsStat || "5,000+",
    authTagline: val.authTagline || "N\u1EC1n t\u1EA3ng h\u1ECDc IELTS hi\u1EC7n \u0111\u1EA1i",
    authFeatureOneTitle: val.authFeatureOneTitle || "Kh\xF3a h\u1ECDc ch\u1EA5t l\u01B0\u1EE3ng",
    authFeatureOneDescription: val.authFeatureOneDescription || "H\xE0ng tr\u0103m b\xE0i h\u1ECDc t\u1EEB c\u01A1 b\u1EA3n \u0111\u1EBFn n\xE2ng cao",
    authFeatureTwoTitle: val.authFeatureTwoTitle || "Gi\xE1o vi\xEAn uy t\xEDn",
    authFeatureTwoDescription: val.authFeatureTwoDescription || "\u0110\u1ED9i ng\u0169 gi\xE1o vi\xEAn gi\xE0u kinh nghi\u1EC7m",
    highlightPresent: val.highlightPresent || "#fff7a5",
    highlightAbsent: val.highlightAbsent || "#ffd7d7",
    highlightInactive: val.highlightInactive || "#e5e7eb",
    sloganText: val.sloganText || "Kh\xE1m ph\xE1 kh\xF3a h\u1ECDc IELTS",
    sloganFontFamily: val.sloganFontFamily || "Be Vietnam Pro",
    sloganFontWeight: val.sloganFontWeight || "bold",
    sloganDesktopSize: Number(val.sloganDesktopSize ?? 56),
    sloganMobileSize: Number(val.sloganMobileSize ?? 34),
    sloganColor: val.sloganColor || "#0f172a",
    sloganAlign: val.sloganAlign || "left",
    sloganLineHeight: Number(val.sloganLineHeight ?? 1.2),
    heroDescriptionText: val.heroDescriptionText || "N\xE2ng cao k\u1EF9 n\u0103ng ti\u1EBFng Anh c\u1EE7a b\u1EA1n v\u1EDBi c\xE1c kh\xF3a h\u1ECDc \u0111\u01B0\u1EE3c thi\u1EBFt k\u1EBF b\u1EDFi \u0111\u1ED9i ng\u0169 gi\xE1o vi\xEAn gi\xE0u kinh nghi\u1EC7m.",
    heroDescriptionFontFamily: val.heroDescriptionFontFamily || "Be Vietnam Pro",
    heroDescriptionFontWeight: val.heroDescriptionFontWeight || "regular",
    heroDescriptionDesktopSize: Number(val.heroDescriptionDesktopSize ?? 30),
    heroDescriptionMobileSize: Number(val.heroDescriptionMobileSize ?? 20),
    heroDescriptionColor: val.heroDescriptionColor || "#64748b",
    heroDescriptionAlign: val.heroDescriptionAlign || "left",
    heroDescriptionLineHeight: Number(val.heroDescriptionLineHeight ?? 1.6),
    updatedAt: record?.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}
var siteSettingsRoutes = async (fastify) => {
  fastify.get("/", async () => {
    let setting = await fastify.prisma.siteSettings.findFirst({
      where: { key: SETTINGS_KEY }
    });
    if (!setting) {
      setting = await fastify.prisma.siteSettings.create({
        data: {
          key: SETTINGS_KEY,
          value: normalizeSettings({})
        }
      });
    }
    return normalizeSettings(setting);
  });
  fastify.put(
    "/",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const parseResult = updateSiteSettingsSchema.safeParse(request.body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues;
        const unrecognizedKeys = issues.filter((i) => i.code === "unrecognized_keys").flatMap((i) => i.keys || []);
        const errorMsg = unrecognizedKeys.length > 0 ? `Tr\u01B0\u1EDDng kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3: ${unrecognizedKeys.join(", ")}` : issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        return reply.status(400).send({
          error: errorMsg,
          details: issues
        });
      }
      const body = parseResult.data;
      let current = await fastify.prisma.siteSettings.findFirst({
        where: { key: SETTINGS_KEY }
      });
      const currentValue = current && typeof current.value === "object" && current.value !== null ? current.value : {};
      const newValue = {
        ...currentValue,
        ...Object.fromEntries(
          Object.entries(body).filter(([, val]) => val !== void 0)
        )
      };
      const updated = current ? await fastify.prisma.siteSettings.update({
        where: { id: current.id },
        data: { value: newValue }
      }) : await fastify.prisma.siteSettings.create({
        data: { key: SETTINGS_KEY, value: newValue }
      });
      return normalizeSettings(updated);
    }
  );
};
var site_settings_routes_default = siteSettingsRoutes;

// server/services/invitation.service.ts
import { InvitationStatus } from "@prisma/client";

// server/repositories/invitation.repository.ts
var InvitationRepository = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async findByCode(inviteCode) {
    return this.prisma.invitation.findUnique({
      where: { inviteCode },
      include: { class: { include: { course: true } } }
    });
  }
  async create(data) {
    return this.prisma.invitation.create({ data });
  }
};

// server/services/invitation.service.ts
var InvitationService = class {
  constructor(prisma) {
    this.prisma = prisma;
    this.invitationRepo = new InvitationRepository(prisma);
    this.classRepo = new ClassRepository(prisma);
    this.authService = new AuthorizationService(prisma);
  }
  invitationRepo;
  classRepo;
  authService;
  // Use Case: Student Joins Class via Code (Atomic Transaction)
  async joinClassByCode(studentId, inviteCode) {
    return this.prisma.$transaction(async (tx) => {
      const invitationRepo = new InvitationRepository(tx);
      const classRepo = new ClassRepository(tx);
      const invitation = await invitationRepo.findByCode(inviteCode.toUpperCase());
      if (!invitation || invitation.status !== InvitationStatus.ACTIVE) {
        throw new Error("M\xE3 m\u1EDDi kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n.");
      }
      if (invitation.expiresAt && /* @__PURE__ */ new Date() > invitation.expiresAt) {
        throw new Error("M\xE3 m\u1EDDi \u0111\xE3 qu\xE1 h\u1EA1n s\u1EED d\u1EE5ng.");
      }
      const alreadyJoined = await classRepo.isStudentInClass(invitation.classId, studentId);
      if (alreadyJoined) {
        return { message: "B\u1EA1n \u0111\xE3 l\xE0 h\u1ECDc vi\xEAn c\u1EE7a l\u1EDBp n\xE0y.", class: invitation.class };
      }
      await classRepo.addStudentToClass(invitation.classId, studentId);
      return {
        success: true,
        message: `\u0110\u0103ng k\xFD tham gia l\u1EDBp ${invitation.class.name} th\xE0nh c\xF4ng!`,
        class: invitation.class
      };
    });
  }
  // Use Case: Admin/Teacher Generates Invitation Code (Authoritative Gate: Teacher owns class or Admin)
  async generateInvitation(classId, createdBy, userRoles = ["teacher"], inviteCode, expiresInDays) {
    await this.authService.requireClassTeacherOrAdmin({
      userId: createdBy,
      userRoles,
      classId
    });
    const code = inviteCode ? inviteCode.toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1e3) : null;
    return this.invitationRepo.create({
      class: { connect: { id: classId } },
      creator: { connect: { id: createdBy } },
      inviteCode: code,
      inviteToken: token,
      expiresAt,
      status: InvitationStatus.ACTIVE
    });
  }
};

// server/validations/schemas.ts
import { z as z12 } from "zod";
var joinByCodeSchema = z12.object({
  inviteCode: z12.string().min(1, "M\xE3 m\u1EDDi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng").max(10)
});
var createInvitationSchema = z12.object({
  classId: z12.string().uuid("ID L\u1EDBp h\u1ECDc kh\xF4ng h\u1EE3p l\u1EC7"),
  inviteCode: z12.string().min(3).max(10).optional(),
  expiresInDays: z12.number().int().positive().optional()
});
var createHomeworkSchema = z12.object({
  classId: z12.string().uuid("ID L\u1EDBp h\u1ECDc kh\xF4ng h\u1EE3p l\u1EC7"),
  classSessionId: z12.string().uuid().optional(),
  lessonId: z12.string().uuid().optional(),
  examId: z12.string().uuid().optional(),
  title: z12.string().min(3, "T\xEAn b\xE0i t\u1EADp ph\u1EA3i t\u1EEB 3 k\xFD t\u1EF1"),
  description: z12.string().optional(),
  deadline: z12.string().datetime().optional()
});
var submitHomeworkSchema = z12.object({
  homeworkId: z12.string().uuid("ID B\xE0i t\u1EADp kh\xF4ng h\u1EE3p l\u1EC7")
});
var gradeSubmissionSchema = z12.object({
  homeworkId: z12.string().uuid("ID B\xE0i t\u1EADp kh\xF4ng h\u1EE3p l\u1EC7"),
  studentId: z12.string().uuid("ID H\u1ECDc vi\xEAn kh\xF4ng h\u1EE3p l\u1EC7"),
  score: z12.number().min(0).max(10, "Band \u0111i\u1EC3m ph\u1EA3i t\u1EEB 0 - 10"),
  feedback: z12.string().min(1, "Nh\u1EADn x\xE9t kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng")
});

// server/routes/invitation.routes.ts
var invitationRoutes = async (fastify) => {
  const invitationService = new InvitationService(fastify.prisma);
  fastify.post("/join", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const body = joinByCodeSchema.parse(request.body);
    const result = await invitationService.joinClassByCode(user.id, body.inviteCode);
    return reply.send(result);
  });
  fastify.post("/generate", { preHandler: [fastify.authenticate, requireRoles("admin", "teacher")] }, async (request, reply) => {
    const user = request.user;
    const body = createInvitationSchema.parse(request.body);
    try {
      const invitation = await invitationService.generateInvitation(
        body.classId,
        user.id,
        user.roles || ["teacher"],
        body.inviteCode,
        body.expiresInDays
      );
      return reply.send({ success: true, invitation });
    } catch (err) {
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
var invitation_routes_default = invitationRoutes;

// server/services/lesson.service.ts
var LessonService = class {
  constructor(prisma) {
    this.prisma = prisma;
    this.classRepo = new ClassRepository(prisma);
    this.authService = new AuthorizationService(prisma);
  }
  classRepo;
  authService;
  // Projection: GET /classes/:classId/lessons
  async getClassLessonProjection(classId, userId, userRoles) {
    const isTeacherOrAdmin = userRoles.includes("admin") || userRoles.includes("teacher");
    const classData = await this.classRepo.findById(classId);
    if (!classData) {
      throw new NotFoundError("L\u1EDBp h\u1ECDc kh\xF4ng t\u1ED3n t\u1EA1i.");
    }
    if (!isTeacherOrAdmin) {
      const isEnrolled = await this.authService.isStudentEnrolledInClass(userId, classId);
      if (!isEnrolled) {
        throw new AuthorizationError("B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp l\u1ED9 tr\xECnh l\u1EDBp h\u1ECDc n\xE0y.", 403);
      }
    } else if (userRoles.includes("teacher") && !userRoles.includes("admin")) {
      if (classData.teacherId !== userId) {
        throw new AuthorizationError("B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n qu\u1EA3n l\xFD l\u1EDBp h\u1ECDc n\xE0y.", 403);
      }
    }
    const courseId = classData.courseId;
    let exams = [];
    let submissions = [];
    if (courseId) {
      exams = await this.prisma.exam.findMany({
        where: { courseId, isPublished: true },
        orderBy: { week: "asc" },
        include: { sections: true }
      });
      const examIds = exams.map((e) => e.id);
      if (examIds.length > 0) {
        submissions = await this.prisma.examSubmission.findMany({
          where: {
            studentId: userId,
            examId: { in: examIds }
          },
          orderBy: { createdAt: "desc" }
        });
      }
    }
    let completedCount = 0;
    const lessonsProjection = exams.map((exam, idx) => {
      const sub = submissions.find((s) => s.examId === exam.id);
      const isGraded = sub?.status === "GRADED" || sub?.status === "graded";
      const isSubmitted = sub?.status === "SUBMITTED" || sub?.status === "submitted" || isGraded;
      if (isGraded) completedCount++;
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description || null,
        lessonOrder: exam.week || idx + 1,
        estimatedMinutes: exam.durationMinutes || 60,
        status: exam.isPublished ? "PUBLISHED" : "DRAFT",
        sessionDate: null,
        sessionNumber: exam.week || idx + 1,
        resources: [],
        homework: {
          id: exam.id,
          title: exam.title,
          deadline: null,
          status: sub ? String(sub.status).toUpperCase() : "NOT_STARTED",
          score: sub?.totalScore != null ? Number(sub.totalScore) : null
        },
        submission: sub || null,
        progress: {
          sessionCompleted: true,
          homeworkSubmitted: isSubmitted,
          homeworkGraded: isGraded,
          lessonCompleted: isGraded
        }
      };
    });
    const totalLessons = exams.length;
    const percentage = totalLessons > 0 ? Math.round(completedCount / totalLessons * 100) : 0;
    return {
      classId: classData.id,
      className: classData.name,
      courseTitle: classData.course?.title || classData.name,
      progress: {
        completedLessons: completedCount,
        totalLessons,
        percentage
      },
      lessons: lessonsProjection
    };
  }
  // Projection: GET /classes/:classId/progress
  async getClassProgressProjection(classId, userId, userRoles) {
    const projection = await this.getClassLessonProjection(classId, userId, userRoles);
    return {
      classId: projection.classId,
      className: projection.className,
      courseTitle: projection.courseTitle,
      progress: projection.progress
    };
  }
};

// server/routes/lesson.routes.ts
var lessonRoutes = async (fastify) => {
  const lessonService = new LessonService(fastify.prisma);
  fastify.get("/classes/:classId/lessons", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { classId } = request.params;
    const projection = await lessonService.getClassLessonProjection(classId, user.id, user.roles || ["student"]);
    return reply.send({ success: true, data: projection });
  });
  fastify.get("/classes/:classId/progress", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { classId } = request.params;
    const progress = await lessonService.getClassProgressProjection(classId, user.id, user.roles || ["student"]);
    return reply.send({ success: true, data: progress });
  });
};
var lesson_routes_default = lessonRoutes;

// server/routes/notifications.routes.ts
var notificationsRoutes = async (fastify) => {
  const notificationService = new NotificationService(fastify.prisma);
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const { page, limit } = request.query || {};
    const result = await notificationService.listNotifications({
      userId: user.id,
      page: page ? parseInt(page, 10) : void 0,
      limit: limit ? parseInt(limit, 10) : void 0
    });
    const unreadCount = await notificationService.getUnreadCount(user.id);
    return reply.send({
      success: true,
      data: result.items,
      unreadCount,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  });
  fastify.get("/unread-count", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const count = await notificationService.getUnreadCount(user.id);
    return reply.send({ success: true, count });
  });
  fastify.patch(
    "/:id/read",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;
      const updated = await notificationService.markAsRead(request.params.id, user.id);
      if (!updated) {
        return reply.status(404).send({ success: false, error: "Notification not found." });
      }
      return reply.send({ success: true });
    }
  );
  fastify.patch("/read-all", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const markedCount = await notificationService.markAllAsRead(user.id);
    return reply.send({ success: true, markedCount });
  });
};
var notifications_routes_default = notificationsRoutes;

// server/services/lead.service.ts
import { LeadStatus } from "@prisma/client";

// server/services/leadNotification.service.ts
import nodemailer from "nodemailer";
var LeadNotificationService = class {
  transporter = null;
  constructor() {
    this.initTransporter();
  }
  initTransporter() {
    if (env.SMTP_HOST) {
      const port = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
      const isSecure = env.SMTP_SECURE === "true" || port === 465;
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure: isSecure,
        auth: env.SMTP_USER && env.SMTP_PASS ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        } : void 0
      });
    } else if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    }
  }
  /**
   * Send notification to staff via Email
   */
  async notifyNewLead(lead) {
    const recipient = env.NOTIFICATION_EMAIL_TO || "arisieltsdeeplearning@gmail.com";
    const formattedDate = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "Asia/Ho_Chi_Minh"
    }).format(lead.createdAt);
    const subject = `\u{1F514} [LEAD M\u1EDAI] Kh\xE1ch h\xE0ng ${lead.fullName} (${lead.phone}) y\xEAu c\u1EA7u t\u01B0 v\u1EA5n`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <div style="display: inline-block; padding: 6px 14px; background-color: #fee2e2; color: #dc2626; font-weight: 800; font-size: 12px; text-transform: uppercase; border-radius: 9999px; letter-spacing: 0.05em; margin-bottom: 8px;">
            Y\xEAu C\u1EA7u T\u01B0 V\u1EA5n M\u1EDBi
          </div>
          <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 800;">H\u1ECCC VI\u1EC6N ARIS IELTS</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Th\xF4ng b\xE1o t\u1EF1 \u0111\u1ED9ng t\u1EEB h\u1EC7 th\u1ED1ng ti\u1EBFp nh\u1EADn kh\xE1ch h\xE0ng</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 600;">H\u1ECD v\xE0 t\xEAn:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 16px;">${lead.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">S\u1ED1 \u0111i\u1EC7n tho\u1EA1i:</td>
              <td style="padding: 8px 0;">
                <a href="tel:${lead.phone}" style="color: #dc2626; font-weight: 800; font-size: 16px; text-decoration: none;">${lead.phone}</a>
                <span style="font-size: 12px; color: #64748b; margin-left: 8px;">(B\u1EA5m \u0111\u1EC3 g\u1ECDi)</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">
                ${lead.email ? `<a href="mailto:${lead.email}" style="color: #2563eb; text-decoration: none;">${lead.email}</a>` : '<span style="color: #94a3b8; font-style: italic;">Ch\u01B0a cung c\u1EA5p</span>'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Ngu\u1ED3n trang:</td>
              <td style="padding: 8px 0; color: #334155; font-weight: 600;">${lead.source || "contact_page"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Th\u1EDDi gian g\u1EEDi:</td>
              <td style="padding: 8px 0; color: #334155;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #334155;">\u{1F3AF} M\u1EE5c ti\xEAu / L\u1EDDi nh\u1EAFn c\u1EE7a h\u1ECDc vi\xEAn:</h4>
          <div style="background-color: #fff; border-left: 4px solid #dc2626; padding: 12px 16px; font-size: 14px; color: #1e293b; background-color: #fef2f2; border-radius: 0 8px 8px 0; line-height: 1.6;">
            ${lead.goal ? lead.goal.replace(/\n/g, "<br/>") : '<span style="color: #94a3b8; font-style: italic;">Kh\xF4ng c\xF3 l\u1EDDi nh\u1EAFn b\u1ED5 sung</span>'}
          </div>
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">M\xE3 Lead: <strong style="font-family: monospace;">${lead.id}</strong></p>
          <p style="margin: 4px 0 0 0;">Vui l\xF2ng li\xEAn h\u1EC7 h\u1ED7 tr\u1EE3 h\u1ECDc vi\xEAn trong v\xF2ng 2\u20134 gi\u1EDD l\xE0m vi\u1EC7c \u0111\u1EC3 \u0111\u1EA1t t\u1EF7 l\u1EC7 chuy\u1EC3n \u0111\u1ED5i cao nh\u1EA5t.</p>
        </div>
      </div>
    `;
    const textContent = `
========================================
\u{1F514} [LEAD M\u1EDAI] C\xD3 Y\xCAU C\u1EA6U T\u01AF V\u1EA4N L\u1ED8 TR\xCCNH
========================================
H\u1ECD v\xE0 t\xEAn: ${lead.fullName}
S\u1ED1 \u0111i\u1EC7n tho\u1EA1i: ${lead.phone}
Email: ${lead.email || "Kh\xF4ng c\xF3"}
M\u1EE5c ti\xEAu / C\xE2u h\u1ECFi: ${lead.goal || "Kh\xF4ng c\xF3"}
Ngu\u1ED3n: ${lead.source || "contact_page"}
Th\u1EDDi gian: ${formattedDate}
M\xE3 Lead: ${lead.id}
========================================
Vui l\xF2ng g\u1ECDi \u0111i\u1EC7n t\u01B0 v\u1EA5n cho h\u1ECDc vi\xEAn s\u1EDBm nh\u1EA5t.
    `.trim();
    if (this.transporter) {
      try {
        const fromAddress = env.SMTP_FROM || `"ARIS IELTS System" <${env.SMTP_USER || "no-reply@nextband.site"}>`;
        await this.transporter.sendMail({
          from: fromAddress,
          to: recipient,
          subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[LeadNotificationService] \u2705 Successfully dispatched lead notification email to ${recipient}`);
      } catch (err) {
        console.error(`[LeadNotificationService] \u274C Failed to send lead email to ${recipient}:`, err?.message || err);
      }
    } else {
      console.warn(
        `[LeadNotificationService] \u26A0\uFE0F SMTP credentials not yet set in .env. Notification prepared for [${recipient}]:
>>> LEAD ID: ${lead.id} | NAME: ${lead.fullName} | PHONE: ${lead.phone} | GOAL: ${lead.goal || "N/A"}`
      );
    }
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try {
        const telegramMessage = `\u{1F514} *[LEAD M\u1EDAI] Y\xCAU C\u1EA6U T\u01AF V\u1EA4N L\u1ED8 TR\xCCNH*

\u{1F464} *H\u1ECD v\xE0 t\xEAn:* ${lead.fullName}
\u{1F4DE} *S\u1ED1 \u0111i\u1EC7n tho\u1EA1i:* \`${lead.phone}\`
\u2709\uFE0F *Email:* ${lead.email || "Ch\u01B0a c\xF3"}
\u{1F3AF} *M\u1EE5c ti\xEAu / L\u1EDDi nh\u1EAFn:* ${lead.goal || "Kh\xF4ng c\xF3"}
\u{1F310} *Ngu\u1ED3n:* ${lead.source || "contact_page"}
\u23F0 *Th\u1EDDi gian:* ${formattedDate}
\u{1F194} *M\xE3 Lead:* \`${lead.id}\``;
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: "Markdown"
          })
        });
        console.log(`[LeadNotificationService] \u2705 Successfully sent Telegram alert for lead ${lead.id}`);
      } catch (tgErr) {
        console.error("[LeadNotificationService] \u274C Failed to send Telegram alert:", tgErr?.message || tgErr);
      }
    }
  }
};
var leadNotificationService = new LeadNotificationService();

// server/services/lead.service.ts
var LeadService = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Create a new contact lead and trigger instant notification
   */
  async createLead(input) {
    const lead = await this.prisma.contactLead.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email && input.email.length > 0 ? input.email : null,
        goal: input.goal && input.goal.length > 0 ? input.goal : null,
        source: input.source || "contact_page",
        status: LeadStatus.NEW
      }
    });
    leadNotificationService.notifyNewLead({
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      goal: lead.goal,
      source: lead.source,
      createdAt: lead.createdAt
    }).catch((err) => {
      console.error("[LeadService] Notification trigger error:", err);
    });
    return lead;
  }
  /**
   * List leads with pagination and search filters
   */
  async listLeads(query) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;
    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.contactLead.count({ where }),
      this.prisma.contactLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      })
    ]);
    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
  /**
   * Get single lead by ID
   */
  async getLeadById(id) {
    return this.prisma.contactLead.findUnique({
      where: { id }
    });
  }
  /**
   * Update lead status / notes / assigned staff
   */
  async updateLead(id, input) {
    const data = {};
    if (input.status !== void 0) data.status = input.status;
    if (input.assignedTo !== void 0) data.assignedTo = input.assignedTo;
    if (input.notes !== void 0) data.notes = input.notes;
    return this.prisma.contactLead.update({
      where: { id },
      data
    });
  }
  /**
   * Delete lead
   */
  async deleteLead(id) {
    return this.prisma.contactLead.delete({
      where: { id }
    });
  }
};

// server/schemas/lead.schema.ts
import { z as z13 } from "zod";
var createLeadSchema = z13.object({
  fullName: z13.string({ required_error: "H\u1ECD v\xE0 t\xEAn l\xE0 b\u1EAFt bu\u1ED9c" }).trim().min(2, "H\u1ECD v\xE0 t\xEAn ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").max(255, "H\u1ECD v\xE0 t\xEAn kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 255 k\xFD t\u1EF1"),
  phone: z13.string({ required_error: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i l\xE0 b\u1EAFt bu\u1ED9c" }).trim().min(9, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 9 ch\u1EEF s\u1ED1").max(20, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7"),
  email: z13.string().trim().email("Email kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng").optional().or(z13.literal("")),
  goal: z13.string().trim().max(2e3, "M\u1EE5c ti\xEAu/l\u1EDDi nh\u1EAFn kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 2000 k\xFD t\u1EF1").optional().or(z13.literal("")),
  source: z13.string().trim().max(100).optional().default("contact_page")
});
var updateLeadSchema = z13.object({
  status: z13.enum(["NEW", "CONTACTED", "ENROLLED", "CANCELLED", "ARCHIVED"]).optional(),
  assignedTo: z13.string().optional().nullable(),
  notes: z13.string().max(2e3).optional().nullable()
});
var listLeadsQuerySchema = z13.object({
  page: z13.coerce.number().min(1).default(1),
  limit: z13.coerce.number().min(1).max(100).default(20),
  status: z13.enum(["NEW", "CONTACTED", "ENROLLED", "CANCELLED", "ARCHIVED"]).optional(),
  search: z13.string().optional()
});

// server/routes/lead.routes.ts
var leadRoutes = async (fastify) => {
  const leadService = new LeadService(fastify.prisma);
  fastify.post("/", async (request, reply) => {
    const validatedData = handleValidation(
      createLeadSchema.safeParse(request.body),
      request,
      reply
    );
    if (!validatedData) return;
    try {
      const lead = await leadService.createLead(validatedData);
      return reply.status(201).send({
        success: true,
        message: "G\u1EEDi y\xEAu c\u1EA7u t\u01B0 v\u1EA5n th\xE0nh c\xF4ng! Ban H\u1ECDc Thu\u1EADt ARIS \u0111\xE3 ti\u1EBFp nh\u1EADn th\xF4ng tin.",
        data: {
          id: lead.id,
          fullName: lead.fullName,
          phone: lead.phone,
          createdAt: lead.createdAt
        }
      });
    } catch (err) {
      request.log.error(err, "Failed to create consultation lead");
      return reply.status(500).send({
        success: false,
        error: "Kh\xF4ng th\u1EC3 x\u1EED l\xFD y\xEAu c\u1EA7u l\xFAc n\xE0y. Vui l\xF2ng li\xEAn h\u1EC7 Hotline 0933.319.693."
      });
    }
  });
  fastify.get(
    "/",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const validatedQuery = handleValidation(
        listLeadsQuerySchema.safeParse(request.query),
        request,
        reply
      );
      if (!validatedQuery) return;
      const result = await leadService.listLeads(validatedQuery);
      return reply.send({
        success: true,
        data: result.items,
        pagination: result.pagination
      });
    }
  );
  fastify.get(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const lead = await leadService.getLeadById(id);
      if (!lead) {
        return reply.status(404).send({
          success: false,
          error: "Kh\xF4ng t\xECm th\u1EA5y th\xF4ng tin t\u01B0 v\u1EA5n"
        });
      }
      return reply.send({
        success: true,
        data: lead
      });
    }
  );
  fastify.patch(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin", "teacher")] },
    async (request, reply) => {
      const { id } = request.params;
      const validatedData = handleValidation(
        updateLeadSchema.safeParse(request.body),
        request,
        reply
      );
      if (!validatedData) return;
      try {
        const updated = await leadService.updateLead(id, validatedData);
        return reply.send({
          success: true,
          data: updated
        });
      } catch (err) {
        return reply.status(404).send({
          success: false,
          error: "Kh\xF4ng t\xECm th\u1EA5y lead ho\u1EB7c kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt"
        });
      }
    }
  );
  fastify.delete(
    "/:id",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { id } = request.params;
      try {
        await leadService.deleteLead(id);
        return reply.send({
          success: true,
          message: "\u0110\xE3 x\xF3a lead th\xE0nh c\xF4ng"
        });
      } catch (err) {
        return reply.status(404).send({
          success: false,
          error: "Kh\xF4ng t\xECm th\u1EA5y lead"
        });
      }
    }
  );
};
var lead_routes_default = leadRoutes;

// server/routes/index.ts
var routes = async (fastify) => {
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    };
  });
  await fastify.register(auth_routes_default, { prefix: "/auth" });
  await fastify.register(courses_routes_default, { prefix: "/courses" });
  await fastify.register(exams_routes_default, { prefix: "/exams" });
  await fastify.register(sections_routes_default, { prefix: "/sections" });
  await fastify.register(questions_routes_default, { prefix: "/questions" });
  await fastify.register(submissionsRoutes, { prefix: "/submissions" });
  await fastify.register(users_routes_default, { prefix: "/users" });
  await fastify.register(enrollments_routes_default, { prefix: "/enrollments" });
  await fastify.register(uploads_routes_default, { prefix: "/uploads" });
  await fastify.register(logs_routes_default, { prefix: "/admin" });
  await fastify.register(classesRoutes, { prefix: "/classes" });
  await fastify.register(highlights_routes_default, { prefix: "/highlights" });
  await fastify.register(attendance_routes_default);
  await fastify.register(site_settings_routes_default, { prefix: "/site-settings" });
  await fastify.register(invitation_routes_default, { prefix: "/invitations" });
  await fastify.register(notifications_routes_default, { prefix: "/notifications" });
  await fastify.register(lead_routes_default, { prefix: "/leads" });
  await fastify.register(lesson_routes_default);
};
var routes_default = routes;

// server/app.ts
async function buildApp() {
  const isServerless = process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || Boolean(process.env.VERCEL_ENV);
  const isProduction = env.NODE_ENV === "production" || process.env.NODE_ENV === "production";
  let loggerConfig;
  if (isServerless || isProduction) {
    loggerConfig = {
      level: isProduction ? "info" : "debug"
    };
  } else {
    const logDir = join3(process.cwd(), "logs");
    if (!existsSync3(logDir)) {
      try {
        mkdirSync2(logDir, { recursive: true });
      } catch {
      }
    }
    const logFile = join3(logDir, "app.log");
    loggerConfig = {
      level: "debug",
      transport: {
        targets: [
          {
            target: "pino-pretty",
            options: { colorize: true },
            level: "debug"
          },
          ...existsSync3(logDir) ? [
            {
              target: "pino/file",
              options: { destination: logFile },
              level: "debug"
            }
          ] : []
        ]
      }
    };
  }
  const app = Fastify({
    logger: loggerConfig
  });
  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("X-Request-ID", request.id);
    if (request.url.startsWith("/api/")) {
      reply.header(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      reply.header("Pragma", "no-cache");
      reply.header("Expires", "0");
      reply.header("Surrogate-Control", "no-store");
    }
    return payload;
  });
  const exactAllowedOrigins = /* @__PURE__ */ new Set([
    "https://nextband.site",
    "https://www.nextband.site"
  ]);
  if (env.FRONTEND_URL) {
    env.FRONTEND_URL.split(",").map((s) => s.trim()).filter(Boolean).forEach((u) => exactAllowedOrigins.add(u));
  }
  if (env.PREVIEW_ALLOWED_ORIGINS) {
    env.PREVIEW_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean).forEach((u) => exactAllowedOrigins.add(u));
  }
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }
      const isProduction2 = process.env.NODE_ENV === "production" || env.NODE_ENV === "production";
      if (!isProduction2) {
        return cb(null, true);
      }
      const isAllowed = exactAllowedOrigins.has(origin);
      cb(null, isAllowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  });
  await app.register(helmet, {
    contentSecurityPolicy: false,
    // CSP is configured on frontend nextband
    hsts: {
      maxAge: 31536e3,
      includeSubDomains: true,
      preload: false
    },
    noSniff: true,
    frameguard: {
      action: "deny"
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    },
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  });
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      if (env.TRUST_PROXY_IPS) {
        const trustedList = env.TRUST_PROXY_IPS.split(",").map((s) => s.trim());
        const remoteSocketIp = request.raw.socket.remoteAddress || "";
        if (trustedList.includes(remoteSocketIp)) {
          const xForwardedFor = request.headers["x-forwarded-for"];
          if (xForwardedFor) {
            const firstIp = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor).split(",")[0].trim();
            if (firstIp) return firstIp;
          }
        }
      }
      return request.ip;
    },
    errorResponseBuilder: (_request, context) => {
      return {
        statusCode: 429,
        error: "Too Many Requests",
        message: `Qu\xE1 nhi\u1EC1u y\xEAu c\u1EA7u. Vui l\xF2ng th\u1EED l\u1EA1i sau ${Math.ceil(context.ttl / 1e3)} gi\xE2y.`,
        retryAfter: Math.ceil(context.ttl / 1e3)
      };
    }
  });
  await app.register(multipart, {
    limits: {
      fileSize: parseInt(env.MAX_FILE_SIZE)
      // 50MB default
    }
  });
  const uploadDir = isServerless ? join3("/tmp", env.UPLOAD_DIR || "uploads") : join3(process.cwd(), env.UPLOAD_DIR || "uploads");
  if (!existsSync3(uploadDir)) {
    try {
      mkdirSync2(uploadDir, { recursive: true });
    } catch {
    }
  }
  if (existsSync3(uploadDir)) {
    await app.register(staticPlugin, {
      root: uploadDir,
      prefix: "/uploads/",
      decorateReply: false
    });
  }
  await app.register(prisma_default);
  await app.register(auth_default);
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    };
  });
  await app.register(routes_default, { prefix: "/api/v1" });
  app.setErrorHandler((error, request, reply) => {
    const isProduction2 = process.env.NODE_ENV === "production" || env.NODE_ENV === "production";
    const statusCode = error.statusCode || 500;
    app.log.error({
      requestId: request.id,
      url: request.url,
      method: request.method,
      statusCode,
      err: error
    });
    if (statusCode >= 500) {
      return reply.status(statusCode).send({
        statusCode,
        error: isProduction2 ? "Internal Server Error" : error.message,
        message: isProduction2 ? "\u0110\xE3 x\u1EA3y ra l\u1ED7i m\xE1y ch\u1EE7 n\u1ED9i b\u1ED9. Vui l\xF2ng li\xEAn h\u1EC7 qu\u1EA3n tr\u1ECB vi\xEAn." : error.message,
        requestId: request.id
      });
    }
    return reply.status(statusCode).send({
      statusCode,
      error: error.message,
      requestId: request.id
    });
  });
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: "Route not found",
      statusCode: 404
    });
  });
  return app;
}
export {
  buildApp
};
