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

/** Shown (and returned by the API) once an event is full: no counts, just that it's closed. */
export function registrationClosedMessage(event: { name: string }): string {
  return `Registrations for ${event.name} are closed.`;
}

// Deliberately no "N spots left" text anywhere: the site only says when an event is closed.
