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

// Spaces and every kind of dash a phone keyboard may insert (hyphen, en/em dash, minus).
const SEPARATORS = /[\s‐-―−_.-]+/g;

/**
 * Reads a registration ID the way people actually type it: "INV-08",
 * "inv 08", "INV08", "INV-8", "INV–08" (en dash), "INV-O8" (letter O), or
 * just "8". Anything that isn't recognisably an ID is returned compacted and
 * upper-cased, so it simply won't match.
 */
export function normalizeRegistrationCode(value: string): string {
  const compact = value.trim().toUpperCase().replace(SEPARATORS, "");
  const match = /^(?:INV)?([0-9O]{1,6})$/.exec(compact);
  if (!match || !/\d/.test(match[1]!)) return compact;
  return formatRegistrationCode(Number(match[1]!.replace(/O/g, "0")));
}
