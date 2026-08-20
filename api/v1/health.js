export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    })
  );
}
