import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | null = null;

/**
 * Compares against a throwaway hash so that a login attempt for an unknown
 * email takes the same time as one for a real account (no user enumeration).
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), COST);
  await bcrypt.compare(password, await dummyHash);
}
