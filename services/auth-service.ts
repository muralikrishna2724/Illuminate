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
import { normalizePhone } from "@/lib/validation/registration";

// Shown for every failure (participant or organiser) and deliberately
// mentions only the participant fields.
const INVALID_CREDENTIALS = "Those details don't match. Check your email and your registration ID or phone number.";

/** 10-digit Indian mobile number (after normalisation), as stored on registrations. */
const PHONE_PATTERN = /^[6-9]\d{9}$/;

export type LoginRole = "admin" | "participant";

export interface LoginResult {
  role: LoginRole;
  redirectTo: string;
}

type Meta = { userAgent: string | null; ipAddress: string | null };

/**
 * One login form for everyone. The second field is interpreted by its shape:
 *  - a registration ID (ILM-XXXXXX) → participant login, valid when that
 *    registration lists the email (contact, participant, team leader or member);
 *  - a 10-digit mobile number → participant login, valid when the email AND
 *    phone belong to the same person on some registration (for people who
 *    forgot their registration ID);
 *  - anything else → admin login with password (admin passwords always
 *    contain letters, so they can never look like a phone number).
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

  const phone = normalizePhone(secret);
  if (PHONE_PATTERN.test(phone) && !/[a-z]/i.test(secret)) {
    // Email and phone must sit on the SAME person record, not just anywhere on
    // the registration (a teammate's phone with your email is not accepted).
    const match = await prisma.registration.findFirst({
      where: {
        OR: [
          { contactEmail: email, contactPhone: phone },
          { participant: { email, phone } },
          { team: { leaderEmail: email, leaderPhone: phone } },
          { team: { members: { some: { email, phone } } } },
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
