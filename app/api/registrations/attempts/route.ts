import { z } from "zod";
import { badRequest, forbidden } from "@/lib/http/errors";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { isSameOrigin } from "@/lib/http/request";
import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { recordAttempt } from "@/services/attempt-service";
import { EVENT_SLUGS } from "@/types/domain";

const text = (max: number) => z.string().max(max).optional();

const reportSchema = z.object({
  event: z.enum(EVENT_SLUGS),
  reason: z.enum(["BLOCKED_IN_BROWSER", "NETWORK_ERROR", "RATE_LIMITED", "PAYLOAD_TOO_LARGE", "SERVER_ERROR"]),
  message: text(300),
  fieldErrors: z.record(z.string().max(80), z.string().max(200)).optional(),
  details: z.record(z.string().max(40), z.unknown()).optional(),
  utr: text(60),
  screenshot: z.object({ name: text(200), type: text(80), size: z.number().nonnegative().optional() }).optional(),
});

/**
 * POST /api/registrations/attempts
 *
 * The registration form reports failures the server never saw: a submission
 * blocked by the browser's own checks on the payment step, a request that
 * never got a proper answer (network loss, a platform error page), or a
 * rate-limited one. Same-origin only, rate limited, bounded payload.
 */
export const POST = route(async (request) => {
  if (!isSameOrigin(request)) throw forbidden("Cross-origin request blocked.");
  enforceRateLimit(request, "attempt-report", RATE_LIMITS.attemptReport);
  if (Number(request.headers.get("content-length") ?? 0) > 32 * 1024) throw badRequest("Report too large.");

  const body: unknown = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid report.");

  const report = parsed.data;
  await recordAttempt({
    eventSlug: report.event,
    source: "BROWSER",
    reason: report.reason,
    message: report.message ?? "",
    fieldErrors: report.fieldErrors ?? null,
    details: report.details,
    utr: report.utr,
    screenshot: report.screenshot ?? null,
    userAgent: request.headers.get("user-agent"),
  });
  return ok({ recorded: true }, 201);
});
