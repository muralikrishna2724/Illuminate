import { getCurrentParticipantEmail } from "@/lib/auth/session";
import { forbidden, unauthorized } from "@/lib/http/errors";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { isSameOrigin } from "@/lib/http/request";
import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { themeChoiceSchema } from "@/lib/validation/registration";
import { chooseHackathonTheme } from "@/services/participant-service";

/**
 * POST /api/participant/theme — { registrationId, theme }
 * A signed-in member of a Deja Vu team that registered before themes existed
 * picks the team's theme, once.
 */
export const POST = route(async (request) => {
  enforceRateLimit(request, "theme", RATE_LIMITS.themeChoice);
  if (!isSameOrigin(request)) throw forbidden("Cross-origin request blocked.");
  const email = await getCurrentParticipantEmail();
  if (!email) throw unauthorized();
  const body: unknown = await request.json().catch(() => ({}));
  const { registrationId, theme } = themeChoiceSchema.parse(body ?? {});
  return ok(await chooseHackathonTheme(email, registrationId, theme));
});
