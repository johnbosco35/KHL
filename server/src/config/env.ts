import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // 4100 rather than 4000, which other local projects commonly use.
  PORT: z.coerce.number().default(4100),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:8080,http://localhost:5173,https://khl-self.vercel.app"),
  APP_URL: z.string().default("http://localhost:8080"),
  // Public URL of this API (defaults to http://localhost:PORT), used to build links to locally stored uploads.
  API_URL: z.string().optional(),
  // Max JSON body size (receipts and product images are sent as base64 data URLs).
  JSON_LIMIT: z.string().default("12mb"),
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is required (your MongoDB connection string)" })
    .min(1, "MONGODB_URI is required (your MongoDB connection string)"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_NAME: z.string().default("KH Luxury Admin"),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("KH Luxury <no-reply@khluxury.com>"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("✖ Invalid environment configuration:");
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  console.error("Copy server/.env.example to server/.env and fill it in.");
  process.exit(1);
}

const data = parsed.data;
export const env = {
  ...data,
  API_URL: (data.API_URL ?? `http://localhost:${data.PORT}`).replace(/\/$/, ""),
};
export const isProd = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

/** Listed origins are allowed; in development any localhost port is too, so Vite picking another port still works. */
export function isAllowedOrigin(origin: string) {
  if (corsOrigins.includes("*") || corsOrigins.includes(origin)) return true;
  return !isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
