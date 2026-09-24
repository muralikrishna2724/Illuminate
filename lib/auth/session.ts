import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getServerEnv } from "@/lib/env";
import type { AdminUser } from "@/types/domain";
import { ADMIN_SESSION_COOKIE } from "./constants";

/**
 * Database-backed admin sessions.
 *
 * - The browser holds an opaque 256-bit random token in an httpOnly,
 *   SameSite=Lax (Secure in production) cookie.
 * - The database stores only HMAC-SHA256(token, ADMIN_SESSION_SECRET), so a
 *   leaked database row cannot be replayed as a cookie.
 * - Logout deletes the row, which invalidates the session immediately.
 */

function hashToken(token: string): string {
  return createHmac("sha256", getServerEnv().ADMIN_SESSION_SECRET).update(token).digest("hex");
}

export async function createAdminSession(
  adminId: string,
  meta: { userAgent?: string | null; ipAddress?: string | null },
): Promise<void> {
  const env = getServerEnv();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.$transaction([
    // Opportunistic cleanup of expired sessions.
    prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.adminSession.create({
      data: {
        adminId,
        tokenHash: hashToken(token),
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
        ipAddress: meta.ipAddress?.slice(0, 100) ?? null,
      },
    }),
    prisma.adminUser.update({ where: { id: adminId }, data: { lastLoginAt: new Date() } }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

/** Returns the signed-in admin, or null. Always validated against the database. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: { select: { id: true, email: true, name: true, isActive: true } } },
  });

  if (!session || session.expiresAt <= new Date() || !session.admin.isActive) {
    return null;
  }
  return { id: session.admin.id, email: session.admin.email, name: session.admin.name };
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
