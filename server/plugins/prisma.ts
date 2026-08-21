import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

function resolveCanonicalDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!url || url.includes("db.gzpdlqxjggyxlkeatvvf.supabase.co")) {
    url = "postgresql://postgres.gzpdlqxjggyxlkeatvvf:anhxtanhmat1@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20";
  }
  return url;
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const dbUrl = resolveCanonicalDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: fastify.log.level === "debug" ? ["query", "error", "warn"] : ["error"],
  });

  try {
    await prisma.$connect();
  } catch (dbErr: any) {
    fastify.log.warn({ err: dbErr }, "Prisma initial connection deferred in serverless runtime");
  }

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: "prisma",
});
