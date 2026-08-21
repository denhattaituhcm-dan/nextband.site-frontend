import esbuild from "esbuild";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

mkdirSync(resolve(rootDir, "api"), { recursive: true });

const entryCode = `
import { buildApp } from "../server/app.js";

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

await esbuild.build({
  stdin: {
    contents: entryCode,
    resolveDir: resolve(rootDir, "api"),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  nodePaths: [
    resolve(rootDir, "node_modules"),
    resolve(rootDir, "nextband/node_modules"),
    resolve(rootDir, "../node_modules"),
  ],
  banner: {
    js: `import { createRequire as __esbuild_createRequire } from "module";
import { fileURLToPath as __esbuild_fileURLToPath } from "url";
import { dirname as __esbuild_dirname } from "path";
const require = __esbuild_createRequire(import.meta.url);
const __filename = __esbuild_fileURLToPath(import.meta.url);
const __dirname = __esbuild_dirname(__filename);
`,
  },
  outfile: resolve(rootDir, "api/index.js"),
  external: ["@prisma/client", "@vercel/node"],
});

console.log("✅ 100% self-contained Fastify Serverless Gateway bundled into api/index.js!");
