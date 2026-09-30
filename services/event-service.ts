import "server-only";
import type { Event as EventRow, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { capacityFrom, registrationFullMessage, type EventCapacity } from "@/lib/events/capacity";
import { AppError, notFound } from "@/lib/http/errors";
import { calculateRegistrationAmount } from "@/lib/pricing";
import type { Event, EventSlug } from "@/types/domain";

export { calculateRegistrationAmount };

export function toEventDto(row: EventRow): Event {
  return {
    slug: row.slug as EventSlug,
    name: row.name,
    day: row.day === 2 ? 2 : 1,
    date: row.date.toISOString().slice(0, 10),
    format: row.format,
    teamSize: row.teamSize,
    feePerPersonInr: row.feePerPersonInr,
    amountInr: calculateRegistrationAmount(row),
  };
}

export async function getEventBySlug(slug: EventSlug): Promise<EventRow> {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) throw notFound("This event is not available for registration yet.");
  return event;
}

export async function getOpenEventBySlug(slug: EventSlug): Promise<EventRow> {
  const event = await getEventBySlug(slug);
  if (!event.registrationOpen) {
    throw new AppError(403, "REGISTRATION_CLOSED", "Registrations for this event are currently closed.");
  }
  return event;
}

type Db = Prisma.TransactionClient | typeof prisma;

/** Registrations holding a spot: every one except those whose payment was rejected. */
function countTakenSpots(db: Db, eventId: string): Promise<number> {
  return db.registration.count({ where: { eventId, payment: { is: { status: { not: "REJECTED" } } } } });
}

/**
 * Refuses a registration once the event's cap is reached. Called again inside
 * the registration transaction, under the ID lock, so two registrations can't
 * both take the last spot.
 */
export async function assertEventHasSpace(db: Db, event: EventRow): Promise<void> {
  if (event.maxRegistrations === null) return;
  if ((await countTakenSpots(db, event.id)) >= event.maxRegistrations) {
    throw new AppError(409, "REGISTRATION_FULL", registrationFullMessage(event, event.maxRegistrations));
  }
}

/** Current capacity per event, for the register pages. Events missing from the database have no limit. */
export async function getEventCapacities(): Promise<Partial<Record<EventSlug, EventCapacity>>> {
  const events = await prisma.event.findMany({ select: { id: true, slug: true, maxRegistrations: true } });
  const entries = await Promise.all(
    events.map(async (e) => {
      const taken = e.maxRegistrations === null ? 0 : await countTakenSpots(prisma, e.id);
      return [e.slug, capacityFrom(e.maxRegistrations, taken)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
