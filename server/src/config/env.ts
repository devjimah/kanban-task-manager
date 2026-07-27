import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27019/kanban?replicaSet=rs0"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  JWT_ACCESS_SECRET: z.string().min(32).default("development-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(32).default("development-refresh-secret-change-me"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
});

export type Environment = z.infer<typeof envSchema>;

// What: Environment parsing function.
// Does: Validates and normalizes runtime configuration before the server uses it.
// If removed: Invalid or missing environment values could reach startup code unchecked.
export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = envSchema.parse(source);
  if (
    parsed.NODE_ENV === "production" &&
    (parsed.JWT_ACCESS_SECRET.startsWith("development-") ||
      parsed.JWT_REFRESH_SECRET.startsWith("development-"))
  ) {
    throw new Error("Production JWT secrets must be explicitly configured");
  }
  return parsed;
}

export const env = loadEnvironment();
