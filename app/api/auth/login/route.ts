import { forbidden } from "@/lib/http/errors";
import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/http/request";
import { login } from "@/services/auth-service";

/** POST /api/auth/login — { email, secret } where secret is an admin password or a registration ID. */
export const POST = route(async (request) => {
  if (!isSameOrigin(request)) throw forbidden("Cross-origin request blocked.");
  enforceRateLimit(request, "login", RATE_LIMITS.login);

  const body: unknown = await request.json().catch(() => null);
  const result = await login(body, {
    userAgent: request.headers.get("user-agent"),
    ipAddress: getClientIp(request),
  });
  return ok(result);
});
