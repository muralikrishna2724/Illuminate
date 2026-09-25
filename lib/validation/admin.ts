import { z } from "zod";
import { EVENT_SLUGS, PAYMENT_STATUSES, QUIZ_ACCESS_RULES } from "@/types/domain";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address.")),
  /** An admin password, or a participant's registration ID (ILM-XXXXXX). */
  secret: z.string().min(1, "Please complete this field.").max(200),
});

export const rejectPaymentSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Please keep the reason under 500 characters.")
    .optional()
    .transform((v) => (v ? v : null)),
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional();

export const registrationFiltersSchema = z.object({
  event: z.enum(EVENT_SLUGS).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  from: isoDate,
  to: isoDate,
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type RegistrationFilters = z.output<typeof registrationFiltersSchema>;

export const quizUpdateSchema = z.object({
  quizLink: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z
        .url({ protocol: /^https?$/, message: "Please enter a full http(s) URL, e.g. https://…" })
        .nullable(),
    ),
  enabled: z.boolean(),
  accessRule: z.enum(QUIZ_ACCESS_RULES),
}).refine((v) => !v.enabled || v.quizLink !== null, {
  path: ["quizLink"],
  message: "Add a quiz link before enabling the quiz.",
});

export type QuizUpdateInput = z.input<typeof quizUpdateSchema>;
