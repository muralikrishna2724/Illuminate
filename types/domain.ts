/**
 * Shared domain types used by both the browser and the server.
 * Database rows are mapped into these DTOs before they leave the server,
 * so internal columns (password hashes, storage keys, …) never reach the client.
 */

export const PAYMENT_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const EVENT_SLUGS = ["hackathon", "debate", "ipl-auction", "illuminate"] as const;
export type EventSlug = (typeof EVENT_SLUGS)[number];

export type EventFormat = "TEAM" | "INDIVIDUAL";

export const QUIZ_ACCESS_RULES = ["AFTER_SUBMISSION", "AFTER_VERIFICATION"] as const;
export type QuizAccessRule = (typeof QUIZ_ACCESS_RULES)[number];

export function isEventSlug(value: string): value is EventSlug {
  return (EVENT_SLUGS as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export interface Event {
  slug: EventSlug;
  name: string;
  day: 1 | 2;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  format: EventFormat;
  teamSize: number;
  feePerPersonInr: number;
  /** Total payable for one registration (feePerPersonInr × teamSize). */
  amountInr: number;
}

export interface Participant {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
}

export interface TeamMember {
  position: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
}

export interface Team {
  name: string;
  college: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  members: TeamMember[];
}

export interface Payment {
  id: string;
  amountInr: number;
  utr: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  screenshot: {
    mimeType: string;
    sizeBytes: number;
    /** Admin-only, authenticated URL. */
    url: string;
  };
}

export interface PaymentAuditEntry {
  action: "VERIFY" | "REJECT";
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
  reason: string | null;
  adminName: string | null;
  createdAt: string;
}

/** Row shown in the admin registrations table. */
export interface RegistrationSummary {
  registrationId: string;
  event: Pick<Event, "slug" | "name" | "day" | "format">;
  /** Team name for team events, participant name for individual events. */
  displayName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  college: string;
  createdAt: string;
  payment: Pick<Payment, "id" | "amountInr" | "utr" | "status" | "verifiedAt" | "rejectionReason"> & {
    screenshotUrl: string;
  };
}

/** Full registration record for the admin detail panel. */
export interface RegistrationDetail extends RegistrationSummary {
  participant: Participant | null;
  team: Team | null;
  paymentDetail: Payment;
  auditLog: PaymentAuditEntry[];
  updatedAt: string;
}

/** Public (student-facing) view of a registration. Contains no personal data. */
export interface PublicRegistrationStatus {
  registrationId: string;
  event: Pick<Event, "slug" | "name" | "day" | "date">;
  amountInr: number;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  submittedAt: string;
}

export interface Quiz {
  eventSlug: EventSlug;
  enabled: boolean;
  quizLink: string | null;
  accessRule: QuizAccessRule;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** What a registrant sees about the Deja Vu qualification quiz. */
export type QuizAccess =
  | { state: "available"; quizLink: string }
  | { state: "not_available" }
  | { state: "awaiting_verification" }
  | { state: "payment_rejected" };

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  day1Registrations: number;
  day2Registrations: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
  byEvent: Array<{
    slug: EventSlug;
    name: string;
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  }>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface RegistrationCreated {
  registrationId: string;
  eventSlug: EventSlug;
  eventName: string;
  amountInr: number;
  paymentStatus: PaymentStatus;
  quiz: QuizAccess | null;
}

/** A registration as shown on the participant's own dashboard. */
export interface ParticipantRegistration {
  registrationId: string;
  event: Pick<Event, "slug" | "name" | "day" | "date">;
  amountInr: number;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  submittedAt: string;
  /** Team events only. */
  team: { name: string; members: string[] } | null;
  quiz: QuizAccess | null;
}
