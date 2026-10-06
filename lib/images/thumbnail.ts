import "server-only";

/** Edge length of the admin table's screenshot thumbnails (rendered at 48px; 2× for sharp screens, with headroom). */
const THUMBNAIL_SIZE = 160;
const MAX_INPUT_PIXELS = 40_000_000;

/**
 * Shrinks a payment screenshot to a small WebP for the admin table, so a page
 * of 25 rows downloads a few hundred KB instead of several MB.
 * Returns null when the image can't be decoded; callers fall back to the original.
 */
export async function screenshotThumbnail(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const { default: sharp } = await import("sharp");
    const out = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "none" })
      .rotate()
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover", position: "top" })
      .webp({ quality: 70 })
      .toBuffer();
    return new Uint8Array(out);
  } catch (error) {
    console.error("[screenshot] could not make a thumbnail", error);
    return null;
  }
}
