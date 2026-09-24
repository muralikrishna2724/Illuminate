import { z } from "zod";

/**
 * Registration schemas — shared by the browser (instant feedback) and the
 * server (authoritative validation). Unknown keys (e.g. a tampered `amount`)
 * are stripped, so the client can never influence pricing.
 */

export const REQUIRED_MESSAGE = "Please complete this field.";

export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Postgraduate", "Other"] as const;

/** Removes control characters and collapses internal whitespace. */
export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const text = (max: number, label = "This field") =>
  z
    .string({ error: REQUIRED_MESSAGE })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, REQUIRED_MESSAGE)
        .max(max, `${label} must be ${max} characters or fewer.`)
        // Reject markup-like input outright; names/colleges never need angle brackets.
        .refine((v) => !/[<>]/.test(v), "Please remove the < and > characters."),
    );

export const nameField = text(100, "Name");
export const collegeField = text(150, "College");
export const departmentField = text(100, "Department");
export const teamNameField = text(60, "Team name");

export const emailField = z
  .string({ error: REQUIRED_MESSAGE })
  .trim()
  .toLowerCase()
  .min(1, REQUIRED_MESSAGE)
  .max(254, "Email is too long.")
  .pipe(z.email("Please enter a valid email address."));

/** Normalises Indian mobile numbers to 10 digits (accepts +91 / 0 prefixes, spaces, dashes). */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const phoneField = z
  .string({ error: REQUIRED_MESSAGE })
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .transform(normalizePhone)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."));

export const yearField = z.enum(YEAR_OPTIONS, { error: "Please select your year of study." });

/** UTR / transaction IDs are normalised before the uniqueness check. */
export function normalizeUtr(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export const utrField = z
  .string({ error: REQUIRED_MESSAGE })
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .transform(normalizeUtr)
  .pipe(
    z
      .string()
      .min(6, "The transaction ID looks too short. Please check it and try again.")
      .max(35, "The transaction ID looks too long. Please check it and try again.")
      .regex(/^[A-Z0-9]+$/, "The transaction ID can only contain letters and numbers."),
  );

export const TEAM_SIZE = 4;

export const teamMemberSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  department: departmentField,
  year: yearField,
});

export const teamRegistrationSchema = z.object({
  teamName: teamNameField,
  college: collegeField,
  leaderName: nameField,
  leaderEmail: emailField,
  leaderPhone: phoneField,
  members: z
    .array(teamMemberSchema, { error: "Please add the team members." })
    .length(TEAM_SIZE, `Teams must have exactly ${TEAM_SIZE} members.`),
});

export const individualRegistrationSchema = z.object({
  fullName: nameField,
  email: emailField,
  phone: phoneField,
  college: collegeField,
  department: departmentField,
  year: yearField,
});

export const paymentProofSchema = z.object({
  utr: utrField,
});

export type TeamRegistrationInput = z.input<typeof teamRegistrationSchema>;
export type TeamRegistrationData = z.output<typeof teamRegistrationSchema>;
export type TeamMemberInput = z.input<typeof teamMemberSchema>;
export type IndividualRegistrationInput = z.input<typeof individualRegistrationSchema>;
export type IndividualRegistrationData = z.output<typeof individualRegistrationSchema>;

/** Flattens Zod issues into `{ "members.2.email": "message" }` (first message per path). */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
