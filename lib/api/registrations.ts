import type {
  IndividualRegistrationInput,
  TeamRegistrationInput,
} from "@/lib/validation/registration";
import type { EventSlug, PaymentStatus, PublicRegistrationStatus, QuizAccess, RegistrationCreated } from "@/types/domain";
import type { HackathonTheme } from "@/lib/events/themes";
import type { ApiErrorBody } from "@/lib/http/api-types";
import { apiRequest, apiUpload, apiUrl } from "./client";

export interface SubmitRegistrationInput {
  event: EventSlug;
  details: TeamRegistrationInput | IndividualRegistrationInput;
  utr: string;
  screenshot: File;
}

/** POST /api/registrations/{event} — details + payment proof in one atomic submission. */
export function submitRegistration(input: SubmitRegistrationInput, onProgress?: (fraction: number) => void) {
  const form = new FormData();
  form.set("details", JSON.stringify(input.details));
  form.set("utr", input.utr);
  form.set("screenshot", input.screenshot, input.screenshot.name);
  return apiUpload<RegistrationCreated>(`/api/registrations/${input.event}`, form, onProgress);
}

export type AttemptReportReason = "BLOCKED_IN_BROWSER" | "NETWORK_ERROR" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "SERVER_ERROR";

/** Whether a failed submission needs reporting from the browser (the API logs everything else itself). */
export function needsAttemptReport(error: ApiErrorBody): error is ApiErrorBody & { code: AttemptReportReason } {
  return Boolean(error.clientSide) || error.code === "RATE_LIMITED";
}

/**
 * Records a registration that didn't go through, so organisers can match the
 * payment. Fire-and-forget: never blocks or changes what the registrant sees.
 */
export function reportFailedAttempt(report: {
  event: EventSlug;
  reason: AttemptReportReason;
  message?: string;
  fieldErrors?: Record<string, string>;
  details: TeamRegistrationInput | IndividualRegistrationInput;
  utr: string;
  screenshot: File | null;
}): void {
  try {
    void fetch(apiUrl("/api/registrations/attempts"), {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: report.event,
        reason: report.reason,
        message: report.message?.slice(0, 300),
        fieldErrors: report.fieldErrors,
        details: report.details,
        utr: report.utr.slice(0, 60),
        screenshot: report.screenshot
          ? { name: report.screenshot.name.slice(0, 200), type: report.screenshot.type.slice(0, 80), size: report.screenshot.size }
          : undefined,
      }),
    }).catch(() => undefined);
  } catch {
    // Reporting is best-effort.
  }
}

/** POST /api/participant/theme — a Deja Vu team registered before themes picks one. */
export function chooseTeamTheme(registrationId: string, theme: HackathonTheme) {
  return apiRequest<{ theme: string }>("/api/participant/theme", { method: "POST", json: { registrationId, theme } });
}

export type RegistrationStatusResponse = PublicRegistrationStatus & { quiz: QuizAccess | null };

export function getRegistrationStatus(registrationId: string) {
  return apiRequest<RegistrationStatusResponse>(`/api/registrations/${encodeURIComponent(registrationId.trim())}`, {
    cache: "no-store",
  });
}

export function getQuizAccess(registrationId: string) {
  return apiRequest<{ registrationId: string; paymentStatus: PaymentStatus; quiz: QuizAccess }>("/api/quiz", {
    query: { registrationId },
    cache: "no-store",
  });
}
