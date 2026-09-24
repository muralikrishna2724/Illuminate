import "server-only";
import { getServerEnv } from "@/lib/env";

/** Best-effort client IP (used only for rate limiting and session metadata). */
export function getClientIp(request: Request): string {
  if (getServerEnv().TRUST_PROXY_HEADERS) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }
  return "unknown";
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests: the Origin
 * (or Referer) must match the Host the request was sent to. SameSite=Lax
 * cookies already block most cross-site POSTs; this is a second layer.
 */
export function isSameOrigin(request: Request): boolean {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
