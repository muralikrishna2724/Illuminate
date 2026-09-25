import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, LOGIN_PATH, PARTICIPANT_SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Early redirect for signed-out visitors: /admin/* and /dashboard go to the
 * login page before rendering. This is NOT the security boundary — every admin
 * page, participant page and API route re-validates the session against the
 * database (see lib/auth/guards.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const toLogin = () => NextResponse.redirect(new URL(LOGIN_PATH, request.url));

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return request.cookies.get(PARTICIPANT_SESSION_COOKIE)?.value ? NextResponse.next() : toLogin();
  }

  const hasAdminSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (pathname === "/admin" || pathname === "/admin/") {
    return hasAdminSession ? NextResponse.redirect(new URL("/admin/dashboard", request.url)) : toLogin();
  }
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasAdminSession) {
    return toLogin();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/dashboard", "/dashboard/:path*"],
};
