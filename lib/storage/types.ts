/**
 * Provider-agnostic object storage contract. Payment screenshots are always
 * private: they are only ever read back through an authenticated admin route.
 * To add another provider (S3, R2, GCS…), implement this interface and
 * register it in `lib/storage/index.ts`.
 */
export interface StoredObject {
  body: Uint8Array;
  contentType: string;
}

export interface ObjectStorage {
  readonly name: string;
  upload(key: string, body: Uint8Array, contentType: string): Promise<void>;
  download(key: string): Promise<StoredObject | null>;
  remove(key: string): Promise<void>;
  /** Short-lived URL for direct access, if the provider supports it. */
  createSignedUrl?(key: string, expiresInSeconds: number): Promise<string | null>;
}

export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StorageError";
  }
}

/** payment-screenshots/{registrationId}/payment.{extension} */
export function paymentScreenshotKey(registrationCode: string, extension: string): string {
  return `payment-screenshots/${registrationCode}/payment.${extension}`;
}
