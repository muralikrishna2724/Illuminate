import "server-only";
import { prisma } from "@/lib/db/prisma";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";
import { unauthorized } from "@/lib/http/errors";
import { loginSchema } from "@/lib/validation/admin";
import type { AdminUser } from "@/types/domain";

const INVALID_CREDENTIALS = "Incorrect email or password.";

export async function loginAdmin(
  input: unknown,
  meta: { userAgent: string | null; ipAddress: string | null },
): Promise<AdminUser> {
  const { email, password } = loginSchema.parse(input);
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !admin.isActive) {
    await burnPasswordCheck(password);
    throw unauthorized(INVALID_CREDENTIALS);
  }
  if (!(await verifyPassword(password, admin.passwordHash))) {
    throw unauthorized(INVALID_CREDENTIALS);
  }

  await createAdminSession(admin.id, meta);
  return { id: admin.id, email: admin.email, name: admin.name };
}
