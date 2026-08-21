import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const dbUrl = process.env.DATABASE_URL;
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
