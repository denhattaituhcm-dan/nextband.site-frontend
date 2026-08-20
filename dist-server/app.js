import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import routes from "./routes/index.js";
export async function buildApp() {
    const isServerless = process.env.VERCEL === "1" ||
        Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
        Boolean(process.env.VERCEL_ENV);
    const isProduction = env.NODE_ENV === "production" || process.env.NODE_ENV === "production";
    let loggerConfig;
    if (isServerless || isProduction) {
        loggerConfig = {
            level: isProduction ? "info" : "debug",
        };
    }
    else {
        const logDir = join(process.cwd(), "logs");
        if (!existsSync(logDir)) {
            try {
                mkdirSync(logDir, { recursive: true });
            }
            catch {
                // Safe failover for readonly environments
            }
        }
        const logFile = join(logDir, "app.log");
        loggerConfig = {
            level: "debug",
            transport: {
                targets: [
                    {
                        target: "pino-pretty",
                        options: { colorize: true },
                        level: "debug",
                    },
                    ...(existsSync(logDir)
                        ? [
                            {
                                target: "pino/file",
                                options: { destination: logFile },
                                level: "debug",
                            },
                        ]
                        : []),
                ],
            },
        };
    }
    const app = Fastify({
        logger: loggerConfig,
    });
    // Observability: Gán X-Request-ID vào mọi Response Header & disable cache cho API
    app.addHook("onSend", async (request, reply, payload) => {
        reply.header("X-Request-ID", request.id);
        if (request.url.startsWith("/api/")) {
            reply.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            reply.header("Pragma", "no-cache");
            reply.header("Expires", "0");
            reply.header("Surrogate-Control", "no-store");
        }
        return payload;
    });
    // Exact CORS Allowlist matching
    const exactAllowedOrigins = new Set([
        "https://nextband.site",
        "https://www.nextband.site",
    ]);
    if (env.FRONTEND_URL) {
        env.FRONTEND_URL.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((u) => exactAllowedOrigins.add(u));
    }
    if (env.PREVIEW_ALLOWED_ORIGINS) {
        env.PREVIEW_ALLOWED_ORIGINS.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((u) => exactAllowedOrigins.add(u));
    }
    await app.register(cors, {
        origin: (origin, cb) => {
            // Direct / non-browser requests without origin header
            if (!origin) {
                return cb(null, true);
            }
            const isProduction = process.env.NODE_ENV === "production" || env.NODE_ENV === "production";
            if (!isProduction) {
                return cb(null, true);
            }
            // Exact match against allowlist Set (no wildcard, case/port/domain sensitive)
            const isAllowed = exactAllowedOrigins.has(origin);
            cb(null, isAllowed);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    });
    // Security Headers via Helmet (API Hardening)
    await app.register(helmet, {
        contentSecurityPolicy: false, // CSP is configured on frontend nextband
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false,
        },
        noSniff: true,
        frameguard: {
            action: "deny",
        },
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin",
        },
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    });
    // Global & Per-Route Rate Limiter
    await app.register(rateLimit, {
        global: true,
        max: 200,
        timeWindow: "1 minute",
        keyGenerator: (request) => {
            // If trusted proxy IPs are configured, verify socket remoteAddress before trusting x-forwarded-for
            if (env.TRUST_PROXY_IPS) {
                const trustedList = env.TRUST_PROXY_IPS.split(",").map((s) => s.trim());
                const remoteSocketIp = request.raw.socket.remoteAddress || "";
                if (trustedList.includes(remoteSocketIp)) {
                    const xForwardedFor = request.headers["x-forwarded-for"];
                    if (xForwardedFor) {
                        const firstIp = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor).split(",")[0].trim();
                        if (firstIp)
                            return firstIp;
                    }
                }
            }
            return request.ip;
        },
        errorResponseBuilder: (_request, context) => {
            return {
                statusCode: 429,
                error: "Too Many Requests",
                message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(context.ttl / 1000)} giây.`,
                retryAfter: Math.ceil(context.ttl / 1000),
            };
        },
    });
    // File upload (multipart)
    await app.register(multipart, {
        limits: {
            fileSize: parseInt(env.MAX_FILE_SIZE), // 50MB default
        },
    });
    // Ensure upload directory exists (safely fallback in serverless)
    const uploadDir = isServerless
        ? join("/tmp", env.UPLOAD_DIR || "uploads")
        : join(process.cwd(), env.UPLOAD_DIR || "uploads");
    if (!existsSync(uploadDir)) {
        try {
            mkdirSync(uploadDir, { recursive: true });
        }
        catch {
            // Ignore in readonly filesystem
        }
    }
    // Serve static files (uploaded files) if directory is accessible
    if (existsSync(uploadDir)) {
        await app.register(staticPlugin, {
            root: uploadDir,
            prefix: "/uploads/",
            decorateReply: false,
        });
    }
    // Plugins
    await app.register(prismaPlugin);
    await app.register(authPlugin);
    // Root Health check for load balancers & Render
    app.get("/health", async () => {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        };
    });
    // API Routes
    await app.register(routes, { prefix: "/api/v1" });
    // Global error handler - Structured logging on server & Clean sanitized response for client
    app.setErrorHandler((error, request, reply) => {
        const isProduction = process.env.NODE_ENV === "production" || env.NODE_ENV === "production";
        const statusCode = error.statusCode || 500;
        // Full diagnostic in server log
        app.log.error({
            requestId: request.id,
            url: request.url,
            method: request.method,
            statusCode,
            err: error,
        });
        if (statusCode >= 500) {
            return reply.status(statusCode).send({
                statusCode,
                error: isProduction ? "Internal Server Error" : error.message,
                message: isProduction
                    ? "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên."
                    : error.message,
                requestId: request.id,
            });
        }
        // Client errors (4xx) - return safe validation or authorization message
        return reply.status(statusCode).send({
            statusCode,
            error: error.message,
            requestId: request.id,
        });
    });
    // Not found handler
    app.setNotFoundHandler((_request, reply) => {
        reply.status(404).send({
            error: "Route not found",
            statusCode: 404,
        });
    });
    return app;
}
