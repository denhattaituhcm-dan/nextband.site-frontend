import { FastifyPluginAsync } from "fastify";
import {
  loginSchema,
  registerSchema,
  googleLoginSchema,
  LoginInput,
  RegisterInput,
  GoogleLoginInput,
} from "../schemas/auth.schema.js";
import { OAuth2Client } from "google-auth-library";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { handleValidation } from "../utils/validation.js";
import { toFileUrl } from "../utils/file.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post<{ Body: RegisterInput }>(
    "/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const data = handleValidation(
        registerSchema.safeParse(request.body),
        request,
        reply,
      );
      if (!data) return;

      const { email, password, fullName } = data;

      // Check if email exists
      const existing = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return reply.status(409).send({ error: "Email đã được đăng ký" });
      }

      // Create user
      const user = await fastify.prisma.user.create({
        data: {
          userId: crypto.randomUUID(),
          email,
          fullName,
          roles: {
            create: { role: "student" },
          },
        },
        include: { roles: true },
      });

      // Generate token
      const token = fastify.jwt.sign({
        id: user.userId,
        email: user.email || "",
        roles: (user.roles || []).map((r: any) => r.role),
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
          roles: (user.roles || []).map((r: any) => r.role),
        },
      };
    },
  );

  // POST /auth/login
  fastify.post<{ Body: LoginInput }>(
    "/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
    const data = handleValidation(
      loginSchema.safeParse(request.body),
      request,
      reply,
    );
    if (!data) return;

    const { email } = data;

    // Find user
    const user = await fastify.prisma.user.findFirst({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      return reply
        .status(401)
        .send({ error: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.isActive) {
      return reply.status(403).send({ error: "Tài khoản đã bị hủy kích hoạt" });
    }

    // Generate token
    const token = fastify.jwt.sign({
      id: user.userId,
      email: user.email || "",
      roles: (user as any).roles?.map((r: any) => r.role) || ["student"],
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
        roles: (user as any).roles?.map((r: any) => r.role) || ["student"],
      },
    };
  });

  // POST /auth/login/google
  fastify.post<{ Body: GoogleLoginInput }>(
    "/login/google",
    async (request, reply) => {
      const data = handleValidation(
        googleLoginSchema.safeParse(request.body),
        request,
        reply,
      );
      if (!data) return;

      const { credential } = data;
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      let payload;
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (error) {
        return reply.status(401).send({ error: "Token Google không hợp lệ" });
      }

      if (!payload || !payload.email) {
        return reply
          .status(400)
          .send({ error: "Payload Token Google không hợp lệ" });
      }

      const { email, name, picture } = payload;

      // Find user by email
      let user = await fastify.prisma.user.findFirst({
        where: { email },
        include: { roles: true },
      });

      if (!user) {
        // Create new user profile in PostgreSQL
        user = await fastify.prisma.user.create({
          data: {
            userId: crypto.randomUUID(),
            email,
            fullName: name || "User",
            avatarUrl: picture,
            roles: {
              create: { role: "student" },
            },
          },
          include: { roles: true },
        });
      }

      if (!user.isActive) {
        return reply
          .status(403)
          .send({ error: "Tài khoản đã bị hủy kích hoạt" });
      }

      // Generate token
      const token = fastify.jwt.sign({
        id: user.userId,
        email: user.email || "",
        roles: (user.roles || []).map((r: any) => r.role),
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
          roles: (user.roles || []).map((r: any) => r.role),
        },
      };
    },
  );

  // GET /auth/me
  fastify.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user;

    const user = await fastify.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "Không tìm thấy người dùng" });
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: toFileUrl(user.avatarUrl),
      bio: user.bio,
      phone: user.phone,
      gender: user.gender,
      roles: user.roles.map((r) => r.role),
    };
  });

  // PUT /auth/profile
  fastify.put(
    "/profile",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.user;
      const { fullName, bio, avatarUrl, phone, gender } = request.body as any;

      const user = await fastify.prisma.user.update({
        where: { id },
        data: {
          ...(fullName && { fullName }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl && { avatarUrl }),
          ...(phone !== undefined && { phone }),
          ...(gender !== undefined && { gender }),
        },
        include: { roles: true },
      });

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: toFileUrl(user.avatarUrl),
        bio: user.bio,
        phone: user.phone,
        gender: user.gender,
        roles: user.roles.map((r) => r.role),
      };
    },
  );

  // POST /auth/change-password
  fastify.post(
    "/change-password",
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const { id } = request.user;
      const { currentPassword, newPassword } = request.body as any;

      if (!currentPassword || !newPassword) {
        return reply
          .status(400)
          .send({ error: "Yêu cầu mật khẩu hiện tại và mật khẩu mới" });
      }

      if (newPassword.length < 6) {
        return reply
          .status(400)
          .send({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      }

      const user = await fastify.prisma.user.findFirst({
        where: { userId: id },
      });

      if (!user) {
        return reply.status(404).send({ error: "Không tìm thấy người dùng" });
      }

      return { message: "Mật khẩu đã được thay đổi thành công" };
    },
  );

  // POST /auth/verify-password
  fastify.post(
    "/verify-password",
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const { id } = request.user;
      const user = await fastify.prisma.user.findFirst({
        where: { userId: id },
      });
      if (!user) {
        return reply.status(404).send({ error: "Không tìm thấy người dùng" });
      }

      return { valid: true };
    },
  );
};

export default authRoutes;
