import { describe, it, expect, beforeAll, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import fp from "fastify-plugin";
import coursesRoutes from "../../../server/routes/courses.routes.js";
import siteSettingsRoutes from "../../../server/routes/site-settings.routes.js";

// Mock Prisma for in-memory testing
const mockPrisma = {
  course: {
    findMany: vi.fn().mockResolvedValue([
      { id: "c-1", title: "IELTS Master", level: "advanced", isPublished: true, isActive: true },
    ]),
    findUnique: vi.fn().mockImplementation(({ where }: any) => {
      if (where.id === "c-1" || where.slug === "ielts-master") {
        return Promise.resolve({
          id: "c-1",
          slug: "ielts-master",
          title: "IELTS Master",
          isPublished: true,
          isActive: true,
          creator: null,
          exams: [],
        });
      }
      return Promise.resolve(null);
    }),
    count: vi.fn().mockResolvedValue(1),
  },
  siteSettings: {
    findFirst: vi.fn().mockResolvedValue({
      id: "global",
      key: "global",
      value: { siteName: "NextBand IELTS" },
    }),
    create: vi.fn().mockResolvedValue({
      id: "global",
      key: "global",
      value: { siteName: "NextBand IELTS" },
    }),
  },
  user: {
    findUnique: vi.fn().mockResolvedValue({ id: "user-1", email: "student@test.com" }),
  },
};

describe("🛡️ ANTI-DATA-LEAK CACHE GATEKEEPER TESTS", () => {
  let app: FastifyInstance;
  let validToken: string;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Register JWT
    await app.register(jwt, {
      secret: "test-secret-1234567890-test-secret-1234567890",
    });

    // Decorate Prisma
    app.decorate("prisma", mockPrisma as any);

    // Attach Canonical onSend Cache Security Hook
    app.addHook("onSend", async (request, reply, payload) => {
      reply.header("X-Request-ID", request.id);

      if (request.url.startsWith("/api/")) {
        const isGet = request.method === "GET";
        const hasAuthHeader = Boolean(request.headers.authorization);
        const isSuccess = reply.statusCode >= 200 && reply.statusCode < 300;
        const urlPath = request.url.split("?")[0].replace(/\/+$/, "");

        const isPublicCourses =
          isGet &&
          !hasAuthHeader &&
          (/^\/api\/v1\/courses(\/.*)?$/.test(urlPath));

        const isPublicSiteSettings =
          isGet &&
          !hasAuthHeader &&
          urlPath === "/api/v1/site-settings";

        // Chỉ cho phép đúng 2 public read-only boundaries được hưởng route-level cache header khi status 2xx và không có Auth header
        if (isSuccess && (isPublicCourses || isPublicSiteSettings) && reply.hasHeader("Cache-Control")) {
          // Allow explicit route cache header
        } else {
          // Enforce absolute no-store on EVERYTHING else (Auth, user mutations, 4xx/5xx, non-whitelisted)
          reply.header(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          );
          reply.header("Pragma", "no-cache");
          reply.header("Expires", "0");
          reply.header("Surrogate-Control", "no-store");
        }
      }

      return payload;
    });

    // Register Routes
    await app.register(
      async (api) => {
        await api.register(coursesRoutes, { prefix: "/courses" });
        await api.register(siteSettingsRoutes, { prefix: "/site-settings" });
        api.get("/auth/me", async () => ({ user: "me" }));
      },
      { prefix: "/api/v1" }
    );

    await app.ready();
    validToken = app.jwt.sign({ id: "user-1", roles: ["student"], email: "student@test.com" });
  });

  describe("1. Public Allowlisted Routes - Unauthenticated Guest Access", () => {
    it("1.1 GET /api/v1/courses without Auth header gets Edge Cache headers", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/courses",
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("s-maxage=300");
      expect(cacheControl).toContain("stale-while-revalidate=600");
    });

    it("1.2 GET /api/v1/courses/:id without Auth header gets Edge Cache headers", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/courses/c-1",
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("s-maxage=300");
    });

    it("1.3 GET /api/v1/courses/slug/:slug without Auth header gets Edge Cache headers", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/courses/slug/ielts-master",
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("s-maxage=300");
    });

    it("1.4 GET /api/v1/site-settings without Auth header gets Edge Cache headers", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/site-settings",
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("s-maxage=600");
    });
  });

  describe("2. Strict Anti-Data-Leak Protection - Authenticated Requests MUST NEVER be Cached", () => {
    it("2.1 GET /api/v1/courses WITH Authorization header MUST return no-store", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/courses",
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("no-store");
      expect(cacheControl).toContain("no-cache");
      expect(res.headers["pragma"]).toBe("no-cache");
      expect(res.headers["surrogate-control"]).toBe("no-store");
    });

    it("2.2 GET /api/v1/site-settings WITH Authorization header MUST return no-store", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/site-settings",
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("no-store");
    });
  });

  describe("3. Non-Whitelisted Routes & Mutations MUST NEVER be Cached", () => {
    it("3.1 GET /api/v1/auth/me MUST return no-store", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });

      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("no-store");
      expect(cacheControl).toContain("no-cache");
    });

    it("3.2 Non-existent 404 routes MUST return no-store", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/courses/non-existent-id-999",
      });

      expect(res.statusCode).toBe(404);
      const cacheControl = res.headers["cache-control"];
      expect(cacheControl).toContain("no-store");
    });
  });
});
