import "server-only";

/**
 * Registration IDs are sequential: INV-01, INV-02, … INV-99, INV-100, …
 * The number is taken inside the registration transaction (see
 * services/registration-service.ts), so a failed attempt never uses one up.
 */
export const REGISTRATION_CODE_PREFIX = "INV-";

export function formatRegistrationCode(n: number): string {
  return `${REGISTRATION_CODE_PREFIX}${String(n).padStart(2, "0")}`;
}

export const REGISTRATION_CODE_PATTERN = /^INV-\d{2,}$/;

export function normalizeRegistrationCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
