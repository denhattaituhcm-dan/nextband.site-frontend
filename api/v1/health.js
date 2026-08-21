
import { buildApp } from "../../dist-server/app.js";

let fastifyApp = null;

export default async function handler(req, res) {
  try {
    if (!fastifyApp) {
      fastifyApp = await buildApp();
      await fastifyApp.ready();
    }

    // Resolve original requested URL before Vercel internal rewrite
    let targetUrl =
      req.headers["x-forwarded-uri"] ||
      req.headers["x-matched-path"] ||
      req.headers["x-vercel-matched-path"] ||
      req.url ||
      "/";

    if (targetUrl === "/api/index" || targetUrl === "/api" || targetUrl === "/api/") {
      targetUrl = req.headers["x-forwarded-uri"] || req.url || "/";
    }

    const response = await fastifyApp.inject({
      method: req.method || "GET",
      url: targetUrl,
      headers: req.headers,
      query: req.query,
      payload: req.body,
    });

    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      }
    }

    res.statusCode = response.statusCode;
    res.end(response.body);
  } catch (err) {
    console.error("Fastify Serverless Handler Error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        statusCode: 500,
        error: "Internal Server Error",
        message: err?.message || "Serverless runtime error",
        stack: err?.stack,
      })
    );
  }
}
