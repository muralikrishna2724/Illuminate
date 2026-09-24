import type {
  IndividualRegistrationInput,
  TeamRegistrationInput,
} from "@/lib/validation/registration";
import type { EventSlug, PaymentStatus, PublicRegistrationStatus, QuizAccess, RegistrationCreated } from "@/types/domain";
import { apiRequest, apiUpload } from "./client";

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
