import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic gate for admin pages: requests without a session cookie are
 * redirected to /admin/login before rendering. This is NOT the security
 * boundary — every admin page and API route re-validates the session against
 * the database (see lib/auth/guards.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL(hasSession ? "/admin/dashboard" : "/admin/login", request.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
