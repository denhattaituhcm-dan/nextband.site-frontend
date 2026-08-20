import { buildApp } from "../server/app.js";

let fastifyApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!fastifyApp) {
      fastifyApp = await buildApp();
      await fastifyApp.ready();
    }
    fastifyApp.server.emit("request", req, res);
  } catch (err: any) {
    console.error("Vercel Fastify Serverless Handler Error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      statusCode: 500,
      error: "Internal Server Error",
      message: err?.message || "Serverless runtime error",
    }));
  }
}
