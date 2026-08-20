let fastifyPromise = null;

async function getFastify() {
  if (!fastifyPromise) {
    fastifyPromise = (async () => {
      const { buildApp } = await import("../server/app.js");
      const app = await buildApp();
      await app.ready();
      return app;
    })();
  }
  return fastifyPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getFastify();
    const response = await app.inject({
      method: req.method || "GET",
      url: req.url || "/api/v1/health",
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
    console.error("Fastify Serverless CJS Error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        statusCode: 500,
        error: "Internal Server Error",
        message: err?.message || "Serverless runtime error",
      })
    );
  }
};
