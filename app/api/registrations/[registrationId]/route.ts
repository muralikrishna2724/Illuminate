import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { getPublicRegistrationStatus } from "@/services/registration-service";

/** Public status lookup by registration ID. Returns no personal data. */
export const GET = route<{ registrationId: string }>(async (request, { params }) => {
  enforceRateLimit(request, "lookup", RATE_LIMITS.publicLookup);
  const { registrationId } = await params;
  return ok(await getPublicRegistrationStatus(registrationId));
});
