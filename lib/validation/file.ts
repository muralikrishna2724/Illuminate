import { ACCEPTED_SCREENSHOT_EXTENSIONS, ACCEPTED_SCREENSHOT_TYPES, MAX_SCREENSHOT_BYTES } from "@/lib/site-config";

export const INVALID_SCREENSHOT_MESSAGE = "Please upload a JPG, JPEG, PNG, or WEBP payment screenshot.";
export const SCREENSHOT_TOO_LARGE_MESSAGE = `The screenshot must be ${Math.round(MAX_SCREENSHOT_BYTES / (1024 * 1024))} MB or smaller.`;
export const SCREENSHOT_REQUIRED_MESSAGE = "Please upload your payment screenshot.";

export type ScreenshotMimeType = (typeof ACCEPTED_SCREENSHOT_TYPES)[number];

export const EXTENSION_FOR_MIME: Record<ScreenshotMimeType, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Lightweight browser-side check (name + declared type + size). The server re-validates by content. */
export function validateScreenshotClientSide(file: { name: string; type: string; size: number }): string | null {
  const lower = file.name.toLowerCase();
  const extOk = ACCEPTED_SCREENSHOT_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const typeOk = (ACCEPTED_SCREENSHOT_TYPES as readonly string[]).includes(file.type);
  if (!extOk || !typeOk) return INVALID_SCREENSHOT_MESSAGE;
  if (file.size === 0) return INVALID_SCREENSHOT_MESSAGE;
  if (file.size > MAX_SCREENSHOT_BYTES) return SCREENSHOT_TOO_LARGE_MESSAGE;
  return null;
}

/**
 * Detects the real image type from the file's magic bytes. The declared
 * Content-Type and the file name are attacker-controlled and are not trusted.
 */
export function detectImageMimeType(bytes: Uint8Array): ScreenshotMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= png.length && png.every((b, i) => bytes[i] === b)) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }
  return null;
}

export type ScreenshotCheck =
  | { ok: true; mimeType: ScreenshotMimeType; extension: string; bytes: Uint8Array }
  | { ok: false; message: string };

/** Server-side validation of an uploaded screenshot. */
export async function validateScreenshotUpload(file: File | null): Promise<ScreenshotCheck> {
  if (!file || file.size === 0) return { ok: false, message: SCREENSHOT_REQUIRED_MESSAGE };
  if (file.size > MAX_SCREENSHOT_BYTES) return { ok: false, message: SCREENSHOT_TOO_LARGE_MESSAGE };

  const lower = file.name.toLowerCase();
  if (!ACCEPTED_SCREENSHOT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return { ok: false, message: INVALID_SCREENSHOT_MESSAGE };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageMimeType(bytes);
  if (!mimeType) return { ok: false, message: INVALID_SCREENSHOT_MESSAGE };

  return { ok: true, mimeType, extension: EXTENSION_FOR_MIME[mimeType], bytes };
}
