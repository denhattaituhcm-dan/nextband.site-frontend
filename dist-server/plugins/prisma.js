import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
const prismaPlugin = async (fastify) => {
    const prisma = new PrismaClient({
        log: fastify.log.level === "debug" ? ["query", "error", "warn"] : ["error"],
    });
    try {
        await prisma.$connect();
    }
    catch (dbErr) {
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
