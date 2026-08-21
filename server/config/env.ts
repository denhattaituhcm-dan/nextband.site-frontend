import { z } from "zod";
import "dotenv/config";

const WEAK_SECRETS = new Set([
  "secret",
  "jwt_secret",
  "supersecret",
  "123456",
  "12345678",
  "password",
  "default_secret",
  "change_me",
]);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.string().default("3000"),
    APP_URL: z.string().optional(), // Full URL của server, VD: https://api.yourdomain.com
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(1, "JWT_SECRET cannot be empty"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    UPLOAD_DIR: z.string().default("uploads"),
    MAX_FILE_SIZE: z.string().default("52428800"), // 50MB
    FRONTEND_URL: z.string().default("http://localhost:5173"),
    PREVIEW_ALLOWED_ORIGINS: z.string().optional(),
    TRUST_PROXY_IPS: z.string().optional(), // Comma-separated list of trusted proxy IPs/CIDRs
    SUPABASE_URL: z.string().default("https://gzpdlqxjggyxlkeatvvf.supabase.co"),
    SUPABASE_JWKS_URL: z.string().optional(),
    NOTIFICATION_EMAIL_TO: z.string().default("arisieltsdeeplearning@gmail.com"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === "production") {
        if (data.JWT_SECRET.length < 32) return false;
        if (WEAK_SECRETS.has(data.JWT_SECRET.toLowerCase())) return false;
      }
      return true;
    },
    {
      message:
        "In production, JWT_SECRET must be at least 32 characters long and cannot be a known weak/default secret.",
      path: ["JWT_SECRET"],
    },
  );

let envData: z.infer<typeof envSchema>;
try {
  envData = envSchema.parse(process.env);
} catch (err: unknown) {
  if (err instanceof z.ZodError) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(err.flatten().fieldErrors),
    );
  } else {
    console.error("❌ Invalid environment variables:", err);
  }
  // Resilient fallback in serverless: do not process.exit(1)
  envData = {
    NODE_ENV: (process.env.NODE_ENV as any) || "production",
    PORT: process.env.PORT || "3000",
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_must_be_set_in_vercel_environment_variables",
    JWT_EXPIRES_IN: "7d",
    UPLOAD_DIR: "uploads",
    MAX_FILE_SIZE: "52428800",
    FRONTEND_URL: "https://nextband.site",
    SUPABASE_URL: "https://gzpdlqxjggyxlkeatvvf.supabase.co",
    NOTIFICATION_EMAIL_TO: "arisieltsdeeplearning@gmail.com",
  };
}

export const env = envData;
