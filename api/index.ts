import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../server/app.js";

let fastifyApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!fastifyApp) {
      fastifyApp = await buildApp();
      await fastifyApp.ready();
    }

    // Capture the original requested URL before Vercel internal rewrite
    const url =
      (req.headers["x-forwarded-uri"] as string) ||
      (req.headers["x-matched-path"] as string) ||
      req.url ||
      "/api/v1/health";

    const response = await fastifyApp.inject({
      method: req.method || "GET",
      url: url,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, string>,
      payload: req.body,
    });

    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        if (value !== undefined) {
          res.setHeader(key, value as any);
        }
      }
    }

    res.status(response.statusCode).send(response.body);
  } catch (err: any) {
    console.error("Fastify Serverless Handler Error:", err);
    res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: err?.message || "Serverless runtime error",
    });
  }
}
