import type { EventFormat } from "@/types/domain";

/**
 * Registration caps. A registration holds a spot unless its payment was
 * rejected, so a rejection frees the spot again.
 */

export interface EventCapacity {
  /** Maximum registrations (teams for team events); null means no limit. */
  cap: number | null;
  taken: number;
  remaining: number | null;
  full: boolean;
}

export function capacityFrom(cap: number | null, taken: number): EventCapacity {
  if (cap === null) return { cap, taken, remaining: null, full: false };
  const remaining = Math.max(0, cap - taken);
  return { cap, taken, remaining, full: remaining === 0 };
}

const spotsLabel = (format: EventFormat, count: number) =>
  format === "TEAM" ? `${count} team spot${count === 1 ? "" : "s"}` : `${count} spot${count === 1 ? "" : "s"}`;

/** "All 10 team spots for IPL Auction have been filled." */
export function spotsFilledMessage(event: { name: string; format: EventFormat }, cap: number): string {
  return `All ${spotsLabel(event.format, cap)} for ${event.name} have been filled.`;
}

export function registrationFullMessage(event: { name: string; format: EventFormat }, cap: number): string {
  return `Registration limit reached. ${spotsFilledMessage(event, cap)}`;
}

/** "Limited to 10 teams · 3 spots left" */
export function capacityLabel(format: EventFormat, capacity: EventCapacity): string | null {
  if (capacity.cap === null || capacity.remaining === null) return null;
  const limit = format === "TEAM" ? `${capacity.cap} teams` : `${capacity.cap} participants`;
  return `Limited to ${limit} · ${capacity.remaining} spot${capacity.remaining === 1 ? "" : "s"} left`;
}
