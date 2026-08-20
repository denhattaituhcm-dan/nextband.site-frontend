module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      runtime: "vercel-serverless",
    })
  );
};
