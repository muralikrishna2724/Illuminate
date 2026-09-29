/**
 * Spotting a payment screenshot that was re-used for a second registration.
 *
 * Each screenshot is reduced to a small greyscale thumbnail. A forwarded or
 * re-saved copy (WhatsApp compression, a resize, PNG ↔ JPG) changes almost no
 * thumbnail pixels by much, while a genuinely different receipt, even one to the
 * same payee from the same phone, changes its time, transaction ID and UTR lines.
 *
 * Measured on real PhonePe receipts: copies change 0–1 pixels by more than
 * {@link PIXEL_DELTA}; a receipt differing only in time, transaction ID and UTR
 * changes 7. Matches are only flagged for an admin to check, never blocked.
 */

export const FINGERPRINT_WIDTH = 64;
export const FINGERPRINT_HEIGHT = 128;
export const FINGERPRINT_BYTES = FINGERPRINT_WIDTH * FINGERPRINT_HEIGHT;

/** A pixel counts as changed when its grey level moves by more than this (0–255). */
const PIXEL_DELTA = 48;
/** At most this many changed pixels still counts as the same screenshot. */
const MAX_CHANGED_PIXELS = 3;
/** Screenshots whose shapes differ by more than this ratio are never compared. */
export const ASPECT_TOLERANCE = 0.02;

export function changedPixels(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== FINGERPRINT_BYTES || b.length !== FINGERPRINT_BYTES) return FINGERPRINT_BYTES;
  let changed = 0;
  for (let i = 0; i < FINGERPRINT_BYTES; i++) {
    if (Math.abs(a[i]! - b[i]!) > PIXEL_DELTA) changed++;
  }
  return changed;
}

export function aspectsComparable(a: number, b: number): boolean {
  return a > 0 && b > 0 && Math.abs(a - b) / Math.max(a, b) <= ASPECT_TOLERANCE;
}

export function looksIdentical(
  a: { fingerprint: Uint8Array; aspect: number },
  b: { fingerprint: Uint8Array; aspect: number },
): boolean {
  return aspectsComparable(a.aspect, b.aspect) && changedPixels(a.fingerprint, b.fingerprint) <= MAX_CHANGED_PIXELS;
}
