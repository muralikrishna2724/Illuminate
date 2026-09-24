import "server-only";
import type { Event as EventRow } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
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
