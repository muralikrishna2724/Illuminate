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
 * Organisers listed in the footer and the "Contact us" pop-up (from the
 * event poster). Add more as { name, phone } with a 10-digit number.
 * Entries containing "PLACEHOLDER" are hidden from the footer and are not
 * dialable.
 */
export const EVENT_CONTACTS: EventContact[] = [
  { name: "CH Sathya Pardha Saradhi", phone: "9903031062" },
  { name: "G Tejaswini", phone: "8074324396" },
];

/** Organisers' email and Instagram (from the event poster). */
export const CONTACT_EMAIL = "ecellcvrce@gmail.com";
export const INSTAGRAM = { handle: "@ecell_cvrce", url: "https://www.instagram.com/ecell_cvrce/" } as const;

/** Host institution and venue (from the event poster). */
export const HOST = {
  name: "CVR College of Engineering",
  accreditation: "A UGC Autonomous Institution, NAAC 'A' Grade",
  town: "Ibrahimpatnam",
  shortLocation: "Ibrahimpatnam, Telangana",
  address: "Vastunagar, Mangalpalli (V), Ibrahimpatnam (M), Rangareddy (D), Telangana 501510",
} as const;

/** Organisations ILLUMINATE is held in collaboration with (from the event poster). */
export const COLLABORATORS: string[] = [
  "IIT Bombay",
  "E-Cell IIT Bombay — National Entrepreneurship Challenge 2026",
  "IEEE ComSoc (IEEE Communications Society)",
  "Sudhan Shetty Innovation Club",
];

export const TAGLINE = ["Learn", "Build", "Innovate"] as const;
export const SIGN_OFF = "Big ideas start with you.";

export function isPlaceholder(value: string): boolean {
  return value.includes("PLACEHOLDER");
}

/** "9876543210" → "+91 98765 43210"; anything else is returned as given. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}

/** `tel:` link for an Indian mobile number. */
export function telHref(phone: string): string {
  return `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;
}

/** Maximum payment screenshot size, shared by the browser and the server. */
// 4 MB keeps the whole multipart request under Vercel's 4.5 MB serverless body limit.
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_SCREENSHOT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;


export interface OrganiserLogo {
  /** Path under /public, e.g. "/logos/college.png". */
  src: string;
  /** The organisation's name, used as the image's alt text. */
  name: string;
  width: number;
  height: number;
}

/**
 * College / organiser logos shown in the homepage hero, left to right.
 * Add an entry only once the organisers have provided the file and have
 * permission to use the logo. Nothing is shown while this list is empty.
 */
export const ORGANISER_LOGOS: OrganiserLogo[] = [];
