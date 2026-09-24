import { badRequest } from "@/lib/http/errors";
import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { getPublicRegistrationStatus } from "@/services/registration-service";
import { QUIZ_EVENT_SLUG } from "@/services/quiz-service";

/**
 * GET /api/quiz?registrationId=ILM-XXXXXX
 * Returns the Deja Vu quiz access state for a registration, applying the
 * admin-configured access rule. The quiz link is never returned without a
 * valid Deja Vu registration ID.
 */
export const GET = route(async (request) => {
  enforceRateLimit(request, "quiz", RATE_LIMITS.publicLookup);
  const registrationId = new URL(request.url).searchParams.get("registrationId");
  if (!registrationId) throw badRequest("A registration ID is required.", { registrationId: "Please enter your registration ID." });

  const status = await getPublicRegistrationStatus(registrationId);
  if (status.event.slug !== QUIZ_EVENT_SLUG || !status.quiz) {
    throw badRequest("The qualification quiz is only for Deja Vu Hackathon registrations.");
  }
  return ok({ registrationId: status.registrationId, paymentStatus: status.paymentStatus, quiz: status.quiz });
});
