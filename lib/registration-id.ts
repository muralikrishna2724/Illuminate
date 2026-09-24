import "server-only";
import { randomInt } from "node:crypto";

// No 0/O, 1/I/L — easy to read aloud and type from a screenshot.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 6;

/** e.g. ILM-7K3QXZ (31^6 ≈ 887M combinations, uniqueness enforced by the database). */
export function generateRegistrationCode(): string {
  let out = "";
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `ILM-${out}`;
}

export const REGISTRATION_CODE_PATTERN = /^ILM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export function normalizeRegistrationCode(value: string): string {
  return value.trim().toUpperCase();
}
