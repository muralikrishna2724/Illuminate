import type { PaymentStatus, Quiz, QuizAccess } from "@/types/domain";

/**
 * Business rule for Deja Vu quiz access. Configurable by admins:
 *  - AFTER_SUBMISSION:   link shown once payment proof is submitted (PENDING or VERIFIED).
 *  - AFTER_VERIFICATION: link shown only once payment is VERIFIED.
 * A REJECTED payment never unlocks the quiz.
 */
export function resolveQuizAccess(config: Pick<Quiz, "enabled" | "quizLink" | "accessRule">, paymentStatus: PaymentStatus): QuizAccess {
  if (paymentStatus === "REJECTED") return { state: "payment_rejected" };
  if (!config.enabled || !config.quizLink) return { state: "not_available" };
  if (config.accessRule === "AFTER_VERIFICATION" && paymentStatus !== "VERIFIED") {
    return { state: "awaiting_verification" };
  }
  return { state: "available", quizLink: config.quizLink };
}
