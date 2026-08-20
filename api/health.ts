export default function handler(req: any, res: any) {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}
