import "server-only";
import { createHash } from "node:crypto";
import { FINGERPRINT_BYTES, FINGERPRINT_HEIGHT, FINGERPRINT_WIDTH } from "./similarity";

export interface ScreenshotFingerprint {
  sha256: string;
  /** Null when the image couldn't be decoded; the upload is still accepted. */
  fingerprint: Uint8Array<ArrayBuffer> | null;
  aspect: number | null;
}

// Refuse to decode decompression bombs (a 4 MB PNG can expand enormously).
const MAX_INPUT_PIXELS = 40_000_000;

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function fingerprintScreenshot(bytes: Uint8Array): Promise<ScreenshotFingerprint> {
  const sha256 = sha256Hex(bytes);
  try {
    const { default: sharp } = await import("sharp");
    const image = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "none" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height) return { sha256, fingerprint: null, aspect: null };
    // EXIF orientations 5–8 are rotated by 90°.
    const rotated = (meta.orientation ?? 1) >= 5;
    const aspect = rotated ? meta.height / meta.width : meta.width / meta.height;

    const pixels = await image
      .rotate()
      .flatten({ background: "#ffffff" })
      .greyscale()
      .resize(FINGERPRINT_WIDTH, FINGERPRINT_HEIGHT, { fit: "fill" })
      .raw()
      .toBuffer();
    if (pixels.length !== FINGERPRINT_BYTES) return { sha256, fingerprint: null, aspect: null };
    return { sha256, fingerprint: new Uint8Array(pixels), aspect };
  } catch (error) {
    console.error("[screenshot] could not fingerprint an upload", error);
    return { sha256, fingerprint: null, aspect: null };
  }
}
