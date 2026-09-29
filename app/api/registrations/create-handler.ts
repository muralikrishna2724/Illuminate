import { AppError, GENERIC_ERROR_MESSAGE } from "@/lib/http/errors";
import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { MAX_SCREENSHOT_BYTES } from "@/lib/site-config";
import { recordAttempt } from "@/services/attempt-service";
import { createRegistration } from "@/services/registration-service";
import type { EventSlug } from "@/types/domain";

// Form fields + screenshot + multipart overhead.
const MAX_BODY_BYTES = MAX_SCREENSHOT_BYTES + 256 * 1024;

/**
 * Shared POST handler for /api/registrations/{event}.
 *
 * Expects multipart/form-data with:
 *   - details:    JSON string of the registration form
 *   - utr:        UTR / transaction ID
 *   - screenshot: JPG / PNG / WEBP image
 * Any `amount` the client sends is ignored — the server computes it.
 *
 * Every rejected submission (except rate-limited ones) is recorded as a
 * failed attempt with whatever contact details and UTR could be read, so
 * organisers can match payments to people who couldn't finish.
 */
export function createRegistrationHandler(slug: EventSlug) {
  return route(async (request) => {
    enforceRateLimit(request, `register:${slug}`, RATE_LIMITS.registration);

    let details: unknown = null;
    let utr: FormDataEntryValue | null = null;
    let screenshot: File | null = null;
    const contentLength = Number(request.headers.get("content-length"));

    try {
      if (!request.headers.get("content-length")) {
        // Refuse streamed bodies of unknown size (browsers always send Content-Length for FormData).
        throw new AppError(411, "VALIDATION_ERROR", "The upload could not be processed. Please try again.");
      }
      if (contentLength > MAX_BODY_BYTES) {
        throw new AppError(413, "PAYLOAD_TOO_LARGE", "The upload is too large. Screenshots must be 4 MB or smaller.", {
          screenshot: "The screenshot must be 4 MB or smaller.",
        });
      }
      if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
        throw new AppError(415, "VALIDATION_ERROR", "Unsupported request format.");
      }

      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        throw new AppError(400, "VALIDATION_ERROR", "The submitted form could not be read. Please try again.");
      }

      const rawDetails = form.get("details");
      if (typeof rawDetails === "string") {
        try {
          details = JSON.parse(rawDetails);
        } catch {
          details = null;
        }
      }
      utr = form.get("utr");
      const file = form.get("screenshot");
      screenshot = file instanceof File ? file : null;

      const created = await createRegistration(slug, { details, utr, screenshot });
      return ok(created, 201);
    } catch (error) {
      const appError = error instanceof AppError ? error : null;
      await recordAttempt({
        eventSlug: slug,
        source: "SERVER",
        reason: appError?.code ?? "SERVER_ERROR",
        message: appError?.message ?? GENERIC_ERROR_MESSAGE,
        fieldErrors: appError?.fieldErrors ?? null,
        details,
        utr,
        // An oversized upload is rejected before it is read; its request size is the best size we have.
        screenshot: screenshot
          ? { name: screenshot.name, type: screenshot.type, size: screenshot.size }
          : appError?.code === "PAYLOAD_TOO_LARGE"
            ? { size: contentLength }
            : null,
        userAgent: request.headers.get("user-agent"),
      });
      throw error;
    }
  });
}
