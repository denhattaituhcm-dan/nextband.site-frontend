import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { createRemoteJWKSet } from "jose";
import { env } from "../config/env.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const jwksUrl = env.SUPABASE_JWKS_URL || `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
export const supabaseJWKS = createRemoteJWKSet(new URL(jwksUrl));
const authPlugin = async (fastify) => {
    await fastify.register(jwt, {
        secret: env.JWT_SECRET,
        sign: {
            expiresIn: env.JWT_EXPIRES_IN,
        },
    });
    fastify.decorate("authenticate", authenticate);
};
export default fp(authPlugin, {
    name: "auth",
    dependencies: ["prisma"],
});
