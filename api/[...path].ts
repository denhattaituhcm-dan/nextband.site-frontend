import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../server/app.js";

let fastifyApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!fastifyApp) {
      fastifyApp = await buildApp();
      await fastifyApp.ready();
    }
    fastifyApp.server.emit("request", req, res);
  } catch (err: any) {
    console.error("Fastify Serverless Handler Error:", err);
    res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: err?.message || "Serverless runtime error",
    });
  }
}
