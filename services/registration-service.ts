import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type Event as EventRow } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { THEMED_EVENT_SLUG } from "@/lib/events/themes";
import { whatsappGroupFor } from "@/lib/events/whatsapp";
import { AppError, badRequest, conflict, notFound } from "@/lib/http/errors";
import { fingerprintScreenshot, type ScreenshotFingerprint } from "@/lib/images/fingerprint";
import { ASPECT_TOLERANCE, looksIdentical } from "@/lib/images/similarity";
import { formatRegistrationCode, normalizeRegistrationCode, REGISTRATION_CODE_PATTERN } from "@/lib/registration-id";
import { getStorage, paymentScreenshotKey } from "@/lib/storage";
import { validateScreenshotUpload } from "@/lib/validation/file";
import {
  individualRegistrationSchema,
  paymentProofSchema,
  teamRegistrationSchemaFor,
  toFieldErrors,
  type IndividualRegistrationData,
  type TeamRegistrationData,
} from "@/lib/validation/registration";
import type { EventSlug, PublicRegistrationStatus, QuizAccess, RegistrationCreated } from "@/types/domain";
import { assertEventHasSpace, calculateRegistrationAmount, getOpenEventBySlug } from "./event-service";
import { getQuizConfig, QUIZ_EVENT_SLUG, resolveQuizAccess } from "./quiz-service";

export const DUPLICATE_UTR_MESSAGE = "This transaction ID has already been submitted.";
export const DUPLICATE_SCREENSHOT_MESSAGE =
  "This payment screenshot has already been used for another registration. Please upload the screenshot of your own payment.";

const duplicateScreenshot = () =>
  conflict(DUPLICATE_SCREENSHOT_MESSAGE, "DUPLICATE_SCREENSHOT", { screenshot: DUPLICATE_SCREENSHOT_MESSAGE });

export interface RegistrationSubmission {
  /** Parsed JSON of the registration form (untrusted). */
  details: unknown;
  /** UTR / transaction ID (untrusted). */
  utr: unknown;
  screenshot: File | null;
}

type ValidatedDetails =
  | { format: "TEAM"; data: TeamRegistrationData }
  | { format: "INDIVIDUAL"; data: IndividualRegistrationData };

function isUniqueViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  const targets = Array.isArray(target) ? target.map(String) : [String(target ?? "")];
  return targets.some((t) => t.includes(field));
}

function validateDetails(event: EventRow, details: unknown, fieldErrors: Record<string, string>): ValidatedDetails | null {
  if (event.format === "TEAM") {
    // The database record is authoritative for team size.
    const parsed = teamRegistrationSchemaFor(event.teamSize, { requireTheme: event.slug === THEMED_EVENT_SLUG }).safeParse(details);
    if (!parsed.success) {
      Object.assign(fieldErrors, toFieldErrors(parsed.error));
      return null;
    }
    return { format: "TEAM", data: parsed.data };
  }
  const parsed = individualRegistrationSchema.safeParse(details);
  if (!parsed.success) {
    Object.assign(fieldErrors, toFieldErrors(parsed.error));
    return null;
  }
  return { format: "INDIVIDUAL", data: parsed.data };
}

function buildRegistrationCreate(
  code: string,
  event: EventRow,
  details: ValidatedDetails,
  payment: Omit<Prisma.PaymentCreateWithoutRegistrationInput, "screenshotPath"> & { screenshotPath: string },
): Prisma.RegistrationCreateInput {
  const base = { registrationCode: code, event: { connect: { id: event.id } }, payment: { create: payment } };

  if (details.format === "TEAM") {
    const d = details.data;
    return {
      ...base,
      contactName: d.leaderName,
      contactEmail: d.leaderEmail,
      contactPhone: d.leaderPhone,
      college: d.college,
      team: {
        create: {
          name: d.teamName,
          college: d.college,
          leaderName: d.leaderName,
          leaderEmail: d.leaderEmail,
          leaderPhone: d.leaderPhone,
          theme: event.slug === THEMED_EVENT_SLUG ? (d.theme ?? null) : null,
          members: {
            create: d.members.map((m, index) => ({
              position: index + 1,
              name: m.name,
              email: m.email,
              phone: m.phone,
              department: m.department,
              year: m.year,
            })),
          },
        },
      },
    };
  }

  const d = details.data;
  return {
    ...base,
    contactName: d.fullName,
    contactEmail: d.email,
    contactPhone: d.phone,
    college: d.college,
    participant: {
      create: {
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        college: d.college,
        department: d.department,
        year: d.year,
      },
    },
  };
}

// Serialises ID allocation across concurrent registrations (transaction-scoped).
const REGISTRATION_CODE_LOCK = 7_203_451;

/** The next number after the highest INV-NN in use, taken while holding the lock. */
async function nextRegistrationNumber(tx: Prisma.TransactionClient): Promise<number> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${REGISTRATION_CODE_LOCK})`;
  const rows = await tx.$queryRaw<Array<{ next: number }>>`
    SELECT (COALESCE(MAX(CAST(SUBSTRING("registrationCode" FROM 5) AS INTEGER)), 0) + 1)::int AS next
    FROM "Registration"
    WHERE "registrationCode" ~ '^INV-[0-9]+$'`;
  return rows[0]?.next ?? 1;
}

/** Whether the exact same file already backs a payment that hasn't been rejected. */
async function screenshotFileInUse(db: Prisma.TransactionClient | typeof prisma, sha256: string): Promise<boolean> {
  const hit = await db.payment.findFirst({
    where: { screenshotSha256: sha256, status: { not: "REJECTED" } },
    select: { id: true },
  });
  return hit !== null;
}

/**
 * The earliest registration (not rejected) whose screenshot looks identical to
 * this one, e.g. the same receipt forwarded over WhatsApp. Flagged, not blocked.
 */
export async function findLookalikeScreenshot(
  print: ScreenshotFingerprint,
  excludePaymentId?: string,
): Promise<string | null> {
  if (!print.fingerprint || !print.aspect) return null;
  const candidates = await prisma.payment.findMany({
    where: {
      status: { not: "REJECTED" },
      screenshotFingerprint: { not: null },
      screenshotAspect: { gte: print.aspect * (1 - ASPECT_TOLERANCE), lte: print.aspect * (1 + ASPECT_TOLERANCE) },
      ...(excludePaymentId ? { id: { not: excludePaymentId } } : {}),
    },
    select: { screenshotFingerprint: true, screenshotAspect: true, registration: { select: { registrationCode: true } } },
    orderBy: { createdAt: "asc" },
  });
  const target = { fingerprint: print.fingerprint, aspect: print.aspect };
  const match = candidates.find(
    (c) =>
      c.screenshotFingerprint &&
      c.screenshotAspect &&
      looksIdentical(target, { fingerprint: c.screenshotFingerprint, aspect: c.screenshotAspect }),
  );
  return match?.registration.registrationCode ?? null;
}

/**
 * Validates and stores a registration with its payment proof.
 *
 * Order of operations:
 *   1. Validate details, UTR and screenshot (all errors reported together).
 *   2. Reject duplicate UTRs early (the unique constraint is the real guard),
 *      and a screenshot file already used by another payment. A look-alike
 *      screenshot (re-saved or forwarded copy) is recorded for admins instead.
 *   3. Upload the screenshot to private object storage (under a random key).
 *   4. In ONE transaction, take the next sequential registration ID under a
 *      lock and create Registration + Team/TeamMembers|Participant + Payment.
 *      A failed transaction rolls back, so no ID is ever skipped.
 *   5. If the transaction fails, delete the uploaded object so nothing is orphaned.
 */
export async function createRegistration(slug: EventSlug, submission: RegistrationSubmission): Promise<RegistrationCreated> {
  const event = await getOpenEventBySlug(slug);
  await assertEventHasSpace(prisma, event);
  const amountInr = calculateRegistrationAmount(event);

  const fieldErrors: Record<string, string> = {};
  const details = validateDetails(event, submission.details, fieldErrors);

  const paymentParsed = paymentProofSchema.safeParse({ utr: submission.utr });
  if (!paymentParsed.success) Object.assign(fieldErrors, toFieldErrors(paymentParsed.error));

  const screenshot = await validateScreenshotUpload(submission.screenshot);
  if (!screenshot.ok) fieldErrors.screenshot = screenshot.message;

  if (!details || !paymentParsed.success || !screenshot.ok) {
    throw badRequest("Please check the highlighted fields.", fieldErrors);
  }

  const utr = paymentParsed.data.utr;
  const existing = await prisma.payment.findUnique({ where: { utr }, select: { id: true } });
  if (existing) throw conflict(DUPLICATE_UTR_MESSAGE, "DUPLICATE_UTR", { utr: DUPLICATE_UTR_MESSAGE });

  const print = await fingerprintScreenshot(screenshot.bytes);
  if (await screenshotFileInUse(prisma, print.sha256)) throw duplicateScreenshot();
  const screenshotMatchCode = await findLookalikeScreenshot(print);

  const storage = getStorage();

  for (let attempt = 0; attempt < 5; attempt++) {
    const key = paymentScreenshotKey(randomUUID(), screenshot.extension);

    await storage.upload(key, screenshot.bytes, screenshot.mimeType);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const code = formatRegistrationCode(await nextRegistrationNumber(tx));
        // Every registration takes the same lock, so this count can't go stale before the insert.
        await assertEventHasSpace(tx, event);
        // Re-checked under the lock so two simultaneous uploads can't both pass.
        if (await screenshotFileInUse(tx, print.sha256)) throw duplicateScreenshot();
        return tx.registration.create({
          data: buildRegistrationCreate(code, event, details, {
            amountInr,
            utr,
            screenshotPath: key,
            screenshotMimeType: screenshot.mimeType,
            screenshotSize: screenshot.bytes.byteLength,
            screenshotSha256: print.sha256,
            screenshotFingerprint: print.fingerprint,
            screenshotAspect: print.aspect,
            screenshotMatchCode,
            status: "PENDING",
          }),
          select: { registrationCode: true, payment: { select: { status: true } } },
        });
      });

      let quiz: QuizAccess | null = null;
      if (slug === QUIZ_EVENT_SLUG) {
        quiz = resolveQuizAccess(await getQuizConfig(), created.payment?.status ?? "PENDING");
      }

      return {
        registrationId: created.registrationCode,
        eventSlug: slug,
        eventName: event.name,
        amountInr,
        paymentStatus: created.payment?.status ?? "PENDING",
        quiz,
        whatsappGroupUrl: whatsappGroupFor(slug, created.payment?.status ?? "PENDING"),
      };
    } catch (error) {
      await storage.remove(key).catch((cleanupError) => {
        console.error("[registration] failed to remove orphaned screenshot", key, cleanupError);
      });
      if (isUniqueViolation(error, "utr")) {
        throw conflict(DUPLICATE_UTR_MESSAGE, "DUPLICATE_UTR", { utr: DUPLICATE_UTR_MESSAGE });
      }
      if (isUniqueViolation(error, "registrationCode")) continue; // guarded by the lock; retry just in case
      throw error;
    }
  }
  throw new AppError(500, "SERVER_ERROR", "Could not generate a registration ID. Please try again.");
}

/** Student-facing status lookup. Returns no personal data. */
export async function getPublicRegistrationStatus(
  rawCode: string,
): Promise<PublicRegistrationStatus & { quiz: QuizAccess | null }> {
  const code = normalizeRegistrationCode(rawCode);
  if (!REGISTRATION_CODE_PATTERN.test(code)) throw notFound("We couldn't find a registration with that ID.");

  const registration = await prisma.registration.findUnique({
    where: { registrationCode: code },
    select: {
      registrationCode: true,
      createdAt: true,
      event: { select: { slug: true, name: true, day: true, date: true } },
      payment: { select: { amountInr: true, status: true, rejectionReason: true } },
    },
  });
  if (!registration || !registration.payment) throw notFound("We couldn't find a registration with that ID.");

  const slug = registration.event.slug as EventSlug;
  const quiz = slug === QUIZ_EVENT_SLUG ? resolveQuizAccess(await getQuizConfig(), registration.payment.status) : null;

  return {
    registrationId: registration.registrationCode,
    event: {
      slug,
      name: registration.event.name,
      day: registration.event.day === 2 ? 2 : 1,
      date: registration.event.date.toISOString().slice(0, 10),
    },
    amountInr: registration.payment.amountInr,
    paymentStatus: registration.payment.status,
    rejectionReason: registration.payment.status === "REJECTED" ? registration.payment.rejectionReason : null,
    submittedAt: registration.createdAt.toISOString(),
    quiz,
  };
}
