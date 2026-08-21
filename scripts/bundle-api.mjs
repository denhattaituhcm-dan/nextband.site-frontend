import esbuild from "esbuild";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

mkdirSync(resolve(rootDir, "api/v1"), { recursive: true });

const createTemplate = (importPath) => `
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
`;

const targets = [
  { out: "api/index.js", importPath: "../server/app.js", dir: "api" },
  { out: "api/v1/courses.js", importPath: "../../server/app.js", dir: "api/v1" },
  { out: "api/v1/classes.js", importPath: "../../server/app.js", dir: "api/v1" },
  { out: "api/v1/exams.js", importPath: "../../server/app.js", dir: "api/v1" },
  { out: "api/v1/submissions.js", importPath: "../../server/app.js", dir: "api/v1" },
  { out: "api/v1/assessment.js", importPath: "../../server/app.js", dir: "api/v1" },
];

for (const target of targets) {
  await esbuild.build({
    stdin: {
      contents: createTemplate(target.importPath),
      resolveDir: resolve(rootDir, target.dir),
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: resolve(rootDir, target.out),
    external: ["@prisma/client", "@vercel/node"],
  });
}

console.log("✅ All standalone Serverless API handlers bundled directly with pure JS bcryptjs!");
