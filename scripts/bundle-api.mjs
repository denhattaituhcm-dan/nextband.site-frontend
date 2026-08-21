import esbuild from "esbuild";
import { writeFileSync, mkdirSync } from "fs";

const template = (importPath) => `
import { buildApp } from "${importPath}";

let fastifyApp = null;

export default async function handler(req, res) {
  try {
    if (!fastifyApp) {
      fastifyApp = await buildApp();
      await fastifyApp.ready();
    }

    const response = await fastifyApp.inject({
      method: req.method || "GET",
      url: req.url,
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

    res.status(response.statusCode).send(response.body);
  } catch (err) {
    console.error("Fastify Serverless Handler Error:", err);
    res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: err?.message || "Serverless runtime error",
    });
  }
}
`;

// 1. Bundle server/app.ts into a standalone bundle dist-server/app.js
await esbuild.build({
  entryPoints: ["server/app.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist-server/app.js",
  external: ["@prisma/client", "bcrypt"],
});

// 2. Generate api/index.js and api/v1/*.js
mkdirSync("api/v1", { recursive: true });

writeFileSync("api/index.js", template("../dist-server/app.js"));
writeFileSync("api/v1/courses.js", template("../../dist-server/app.js"));
writeFileSync("api/v1/classes.js", template("../../dist-server/app.js"));
writeFileSync("api/v1/exams.js", template("../../dist-server/app.js"));
writeFileSync("api/v1/submissions.js", template("../../dist-server/app.js"));

console.log("✅ All API serverless endpoints bundled successfully!");
