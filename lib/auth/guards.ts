import "server-only";
import { redirect } from "next/navigation";
import { forbidden, unauthorized } from "@/lib/http/errors";
import { enforceRateLimit } from "@/lib/http/respond";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { isSameOrigin } from "@/lib/http/request";
import type { AdminUser } from "@/types/domain";
import { getCurrentAdmin } from "./session";

/** For admin Server Components / pages: redirects to the login page when not signed in. */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * For admin API route handlers. Throws 401 when not signed in and, for
 * state-changing methods, 403 when the request is cross-origin.
 */
export async function requireAdminApi(request: Request): Promise<AdminUser> {
  enforceRateLimit(request, "admin", RATE_LIMITS.admin);
  const admin = await getCurrentAdmin();
  if (!admin) throw unauthorized();
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request)) {
    throw forbidden("Cross-origin request blocked.");
  }
  return admin;
}
