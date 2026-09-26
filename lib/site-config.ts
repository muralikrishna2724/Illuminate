/**
 * Public, non-secret site configuration.
 *
 * Values that are not yet confirmed are left empty and rendered as clearly
 * marked placeholders (e.g. "UPI_ID_PLACEHOLDER"). Set them through the
 * environment variables listed in `.env.example`; they are read on the server
 * and passed to the UI as props, so no secret ever reaches the browser.
 */

export interface PaymentConfig {
  upiId: string | null;
  payeeName: string | null;
  /** Public URL/path of the organiser's UPI QR image, e.g. /payment/upi-qr.png */
  qrImageUrl: string | null;
}

export interface ContactConfig {
  email: string | null;
  phone: string | null;
}

export const PLACEHOLDERS = {
  upiId: "UPI_ID_PLACEHOLDER",
  payeeName: "PAYEE_NAME_PLACEHOLDER",
  contactEmail: "CONTACT_EMAIL_PLACEHOLDER",
  contactPhone: "CONTACT_PHONE_PLACEHOLDER",
  venue: "VENUE_PLACEHOLDER",
} as const;

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getPaymentConfig(): PaymentConfig {
  return {
    upiId: clean(process.env.PAYMENT_UPI_ID),
    payeeName: clean(process.env.PAYMENT_PAYEE_NAME),
    qrImageUrl: clean(process.env.PAYMENT_QR_IMAGE_URL),
  };
}

export function getContactConfig(): ContactConfig {
  return {
    email: clean(process.env.CONTACT_EMAIL),
    phone: clean(process.env.CONTACT_PHONE),
  };
}

/** Maximum payment screenshot size, shared by the browser and the server. */
// 4 MB keeps the whole multipart request under Vercel's 4.5 MB serverless body limit.
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_SCREENSHOT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

