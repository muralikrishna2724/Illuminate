import "server-only";
import type { AttemptSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { EVENT_SLUGS, type EventSlug } from "@/types/domain";

/**
 * Failed registration attempts. Recorded so organisers can match a payment
 * to someone who paid but couldn't finish registering. Logging must never
 * change what the registrant sees, so every write swallows its own errors.
 */

const MAX_TEXT = 300;
const clip = (value: unknown, max = MAX_TEXT): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

/** Pulls the contact fields out of a team or individual registration form, however incomplete. */
export function contactFromDetails(details: unknown): { name: string | null; email: string | null; phone: string | null } {
  const d = (typeof details === "object" && details !== null ? details : {}) as Record<string, unknown>;
  return {
    name: clip(d.fullName ?? d.leaderName),
    email: clip(d.email ?? d.leaderEmail)?.toLowerCase() ?? null,
    phone: clip(d.phone ?? d.leaderPhone, 40)?.replace(/\D/g, "").slice(-10) || null,
  };
}

export interface AttemptInput {
  eventSlug: string;
  source: AttemptSource;
  reason: string;
  message: string;
  fieldErrors?: Record<string, string> | null;
  details?: unknown;
  utr?: unknown;
  screenshot?: { name?: unknown; type?: unknown; size?: unknown } | null;
  userAgent?: string | null;
}

function boundedFieldErrors(fieldErrors: Record<string, string> | null | undefined): Prisma.InputJsonValue | undefined {
  if (!fieldErrors) return undefined;
  const entries = Object.entries(fieldErrors)
    .slice(0, 40)
    .map(([key, value]) => [key.slice(0, 80), String(value).slice(0, 200)] as const);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export async function recordAttempt(input: AttemptInput): Promise<void> {
  try {
    const contact = contactFromDetails(input.details);
    const size = Number(input.screenshot?.size);
    await prisma.registrationAttempt.create({
      data: {
        eventSlug: clip(input.eventSlug, 40) ?? "unknown",
        source: input.source,
        reason: clip(input.reason, 40) ?? "UNKNOWN",
        message: clip(input.message) ?? "",
        fieldErrors: boundedFieldErrors(input.fieldErrors),
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        utr: clip(input.utr, 60)?.toUpperCase().replace(/[\s-]/g, "") ?? null,
        screenshotName: clip(input.screenshot?.name, 200),
        screenshotType: clip(input.screenshot?.type, 80),
        screenshotSize: Number.isFinite(size) && size >= 0 ? Math.min(Math.round(size), 2_000_000_000) : null,
        userAgent: clip(input.userAgent, 300),
      },
    });
  } catch (error) {
    console.error("[attempts] could not record a failed registration attempt", error);
  }
}

export interface AttemptRow {
  id: string;
  createdAt: string;
  eventSlug: string;
  source: AttemptSource;
  reason: string;
  message: string;
  fieldErrors: Record<string, string> | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  utr: string | null;
  screenshotType: string | null;
  screenshotSize: number | null;
  /** A registration for the same event and email, phone or UTR, if one exists. */
  registeredAs: string | null;
}

/** Newest first. `registeredAs` shows whether the person got through later. */
export async function listAttempts(filter: { event?: string | null; limit?: number } = {}): Promise<AttemptRow[]> {
  const event = filter.event && (EVENT_SLUGS as readonly string[]).includes(filter.event) ? (filter.event as EventSlug) : null;
  const rows = await prisma.registrationAttempt.findMany({
    where: event ? { eventSlug: event } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(filter.limit ?? 500, 1000),
  });

  const emails = [...new Set(rows.map((r) => r.contactEmail).filter((v): v is string => !!v))];
  const phones = [...new Set(rows.map((r) => r.contactPhone).filter((v): v is string => !!v))];
  const utrs = [...new Set(rows.map((r) => r.utr).filter((v): v is string => !!v))];
  const registrations =
    emails.length || phones.length || utrs.length
      ? await prisma.registration.findMany({
          where: {
            OR: [
              ...(emails.length ? [{ contactEmail: { in: emails, mode: "insensitive" as const } }] : []),
              ...(phones.length ? [{ contactPhone: { in: phones } }] : []),
              ...(utrs.length ? [{ payment: { utr: { in: utrs } } }] : []),
            ],
          },
          select: { registrationCode: true, contactEmail: true, contactPhone: true, event: { select: { slug: true } }, payment: { select: { utr: true } } },
        })
      : [];

  return rows.map((r) => {
    const match = registrations.find(
      (reg) =>
        reg.event.slug === r.eventSlug &&
        ((r.contactEmail && reg.contactEmail.toLowerCase() === r.contactEmail) ||
          (r.contactPhone && reg.contactPhone === r.contactPhone) ||
          (r.utr && reg.payment?.utr === r.utr)),
    );
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      eventSlug: r.eventSlug,
      source: r.source,
      reason: r.reason,
      message: r.message,
      fieldErrors: (r.fieldErrors as Record<string, string> | null) ?? null,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      utr: r.utr,
      screenshotType: r.screenshotType,
      screenshotSize: r.screenshotSize,
      registeredAs: match?.registrationCode ?? null,
    };
  });
}
