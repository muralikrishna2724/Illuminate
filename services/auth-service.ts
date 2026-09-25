import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ADMIN_HOME, PARTICIPANT_HOME } from "@/lib/auth/constants";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import {
  createAdminSession,
  createParticipantSession,
  destroyAdminSession,
  destroyParticipantSession,
} from "@/lib/auth/session";
import { unauthorized } from "@/lib/http/errors";
import { normalizeRegistrationCode, REGISTRATION_CODE_PATTERN } from "@/lib/registration-id";
import { loginSchema } from "@/lib/validation/admin";

const INVALID_CREDENTIALS = "That email and password / registration ID don't match.";

export type LoginRole = "admin" | "participant";

export interface LoginResult {
  role: LoginRole;
  redirectTo: string;
}

type Meta = { userAgent: string | null; ipAddress: string | null };

/**
 * One login form for everyone:
 *  - a secret shaped like a registration ID (ILM-XXXXXX) → participant login,
 *    valid when that registration lists the email (contact, participant,
 *    team leader or team member);
 *  - anything else → admin login with password.
 * The error message is identical for every failure so it reveals nothing
 * about which emails exist.
 */
export async function login(input: unknown, meta: Meta): Promise<LoginResult> {
  const { email, secret } = loginSchema.parse(input);
  const code = normalizeRegistrationCode(secret);

  if (REGISTRATION_CODE_PATTERN.test(code)) {
    const match = await prisma.registration.findFirst({
      where: {
        registrationCode: code,
        OR: [
          { contactEmail: email },
          { participant: { email } },
          { team: { leaderEmail: email } },
          { team: { members: { some: { email } } } },
        ],
      },
      select: { id: true },
    });
    if (!match) throw unauthorized(INVALID_CREDENTIALS);
    await destroyAdminSession();
    await createParticipantSession(email, meta);
    return { role: "participant", redirectTo: PARTICIPANT_HOME };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    await burnPasswordCheck(secret);
    throw unauthorized(INVALID_CREDENTIALS);
  }
  if (!(await verifyPassword(secret, admin.passwordHash))) {
    throw unauthorized(INVALID_CREDENTIALS);
  }
  await destroyParticipantSession();
  await createAdminSession(admin.id, meta);
  return { role: "admin", redirectTo: ADMIN_HOME };
}

export async function logoutEveryone(): Promise<void> {
  await destroyAdminSession();
  await destroyParticipantSession();
}
