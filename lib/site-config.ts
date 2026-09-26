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

export const PLACEHOLDERS = {
  upiId: "UPI_ID_PLACEHOLDER",
  payeeName: "PAYEE_NAME_PLACEHOLDER",
  contactName: "CONTACT_NAME_PLACEHOLDER",
  contactPhone: "CONTACT_PHONE_PLACEHOLDER",
  venue: "VENUE_PLACEHOLDER",
} as const;

/**
 * Confirmed payment details. The QR (public/payment/upi-qr.png) was cropped
 * from the organisers' PhonePe QR and pays the payee below. The UPI ID is
 * deliberately not printed on the site (it is a personal phone number);
 * payers scan or save the QR instead.
 * Environment variables PAYMENT_PAYEE_NAME / PAYMENT_QR_IMAGE_URL /
 * PAYMENT_UPI_ID override these without a code change.
 */
const PAYMENT_DEFAULTS: PaymentConfig = {
  upiId: null,
  payeeName: "CHEKURI SATHYA PARDHA SARADHI",
  qrImageUrl: "/payment/upi-qr.png",
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getPaymentConfig(): PaymentConfig {
  return {
    upiId: clean(process.env.PAYMENT_UPI_ID) ?? PAYMENT_DEFAULTS.upiId,
    payeeName: clean(process.env.PAYMENT_PAYEE_NAME) ?? PAYMENT_DEFAULTS.payeeName,
    qrImageUrl: clean(process.env.PAYMENT_QR_IMAGE_URL) ?? PAYMENT_DEFAULTS.qrImageUrl,
  };
}

export interface EventContact {
  name: string;
  phone: string;
  /** Optional short label, e.g. "Deja Vu Hackathon" or "Payments". */
  role?: string;
}

/**
 * People listed in the footer's "Contact us" pop-up.
 * Replace the placeholders with real names and 10-digit numbers (3–4 people).
 * Entries still containing "PLACEHOLDER" are shown as placeholders and are
 * not dialable.
 */
export const EVENT_CONTACTS: EventContact[] = [
  { name: "CONTACT_NAME_1_PLACEHOLDER", phone: "CONTACT_PHONE_1_PLACEHOLDER" },
  { name: "CONTACT_NAME_2_PLACEHOLDER", phone: "CONTACT_PHONE_2_PLACEHOLDER" },
  { name: "CONTACT_NAME_3_PLACEHOLDER", phone: "CONTACT_PHONE_3_PLACEHOLDER" },
  { name: "CONTACT_NAME_4_PLACEHOLDER", phone: "CONTACT_PHONE_4_PLACEHOLDER" },
];

export function isPlaceholder(value: string): boolean {
  return value.includes("PLACEHOLDER");
}

/** Maximum payment screenshot size, shared by the browser and the server. */
// 4 MB keeps the whole multipart request under Vercel's 4.5 MB serverless body limit.
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_SCREENSHOT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

