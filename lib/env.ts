import "server-only";
import { z } from "zod";

/**
 * Server-only environment. Importing this module from a Client Component is a
 * build error (via `server-only`), which keeps DATABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY and ADMIN_SESSION_SECRET out of browser bundles.
 */
const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    ADMIN_SESSION_SECRET: z.string().min(32, "ADMIN_SESSION_SECRET must be at least 32 characters"),
    ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().positive().max(24 * 30).default(12),
    STORAGE_PROVIDER: z.enum(["supabase", "local"]).default("supabase"),
    LOCAL_STORAGE_DIR: z.string().default("./storage"),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default("payment-screenshots"),
    TRUST_PROXY_HEADERS: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    ALLOW_LOCAL_STORAGE_IN_PRODUCTION: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_PROVIDER === "supabase") {
      if (!env.SUPABASE_URL) {
        ctx.addIssue({ code: "custom", path: ["SUPABASE_URL"], message: "SUPABASE_URL is required when STORAGE_PROVIDER=supabase" });
      }
      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["SUPABASE_SERVICE_ROLE_KEY"],
          message: "SUPABASE_SERVICE_ROLE_KEY is required when STORAGE_PROVIDER=supabase",
        });
      }
    }
    if (env.NODE_ENV === "production" && env.STORAGE_PROVIDER === "local" && !env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION) {
      ctx.addIssue({
        code: "custom",
        path: ["STORAGE_PROVIDER"],
        message:
          "STORAGE_PROVIDER=local is intended for development. Use supabase in production, or set ALLOW_LOCAL_STORAGE_IN_PRODUCTION=true for a single server with a persistent disk.",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Lazily validated so that `next build` does not require runtime secrets. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server environment configuration:\n${details}`);
  }
  cached = parsed.data;
  return cached;
}
