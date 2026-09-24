import "server-only";
import { Prisma, type Event as EventRow } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError, badRequest, conflict, notFound } from "@/lib/http/errors";
import { generateRegistrationCode, normalizeRegistrationCode, REGISTRATION_CODE_PATTERN } from "@/lib/registration-id";
import { getStorage, paymentScreenshotKey } from "@/lib/storage";
import { validateScreenshotUpload } from "@/lib/validation/file";
import {
  individualRegistrationSchema,
  paymentProofSchema,
  teamRegistrationSchema,
  toFieldErrors,
  type IndividualRegistrationData,
  type TeamRegistrationData,
} from "@/lib/validation/registration";
import type { EventSlug, PublicRegistrationStatus, QuizAccess, RegistrationCreated } from "@/types/domain";
import { calculateRegistrationAmount, getOpenEventBySlug } from "./event-service";
import { getQuizConfig, QUIZ_EVENT_SLUG, resolveQuizAccess } from "./quiz-service";

export const DUPLICATE_UTR_MESSAGE = "This transaction ID has already been submitted.";

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
    const parsed = teamRegistrationSchema.safeParse(details);
    if (!parsed.success) {
      Object.assign(fieldErrors, toFieldErrors(parsed.error));
      return null;
    }
    // The database record is authoritative for team size.
    if (parsed.data.members.length !== event.teamSize) {
      fieldErrors.members = `Teams must have exactly ${event.teamSize} members.`;
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

/**
 * Validates and stores a registration with its payment proof.
 *
 * Order of operations:
 *   1. Validate details, UTR and screenshot (all errors reported together).
 *   2. Reject duplicate UTRs early (the unique constraint is the real guard).
 *   3. Upload the screenshot to private object storage.
 *   4. Create Registration + Team/TeamMembers|Participant + Payment in ONE transaction.
 *   5. If the transaction fails, delete the uploaded object so nothing is orphaned.
 */
export async function createRegistration(slug: EventSlug, submission: RegistrationSubmission): Promise<RegistrationCreated> {
  const event = await getOpenEventBySlug(slug);
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

  const storage = getStorage();

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRegistrationCode();
    const key = paymentScreenshotKey(code, screenshot.extension);

    await storage.upload(key, screenshot.bytes, screenshot.mimeType);

    try {
      const created = await prisma.$transaction(async (tx) => {
        return tx.registration.create({
          data: buildRegistrationCreate(code, event, details, {
            amountInr,
            utr,
            screenshotPath: key,
            screenshotMimeType: screenshot.mimeType,
            screenshotSize: screenshot.bytes.byteLength,
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
      };
    } catch (error) {
      await storage.remove(key).catch((cleanupError) => {
        console.error("[registration] failed to remove orphaned screenshot", key, cleanupError);
      });
      if (isUniqueViolation(error, "utr")) {
        throw conflict(DUPLICATE_UTR_MESSAGE, "DUPLICATE_UTR", { utr: DUPLICATE_UTR_MESSAGE });
      }
      if (isUniqueViolation(error, "registrationCode")) continue; // extremely unlikely; retry with a new code
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
