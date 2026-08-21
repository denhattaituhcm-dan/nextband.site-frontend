import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import jwt from "@fastify/jwt";
import { createRemoteJWKSet } from "jose";
import { env } from "../config/env.js";
import { authenticate } from "../middlewares/auth.middleware.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id?: string;
      sub?: string;
      email?: string;
      roles?: string[];
    };
    user: {
      id: string;
      email: string;
      roles: string[];
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const getJwksUrl = () => {
  const base = env.SUPABASE_URL || "https://gzpdlqxjggyxlkeatvvf.supabase.co";
  return env.SUPABASE_JWKS_URL || `${base.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
};

export const supabaseJWKS = createRemoteJWKSet(new URL(getJwksUrl()));

const authPlugin: FastifyPluginAsync = async (fastify) => {
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


