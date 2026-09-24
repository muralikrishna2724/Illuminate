import { AppError } from "@/lib/http/errors";
import { enforceRateLimit, ok, route } from "@/lib/http/respond";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { MAX_SCREENSHOT_BYTES } from "@/lib/site-config";
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
 */
export function createRegistrationHandler(slug: EventSlug) {
  return route(async (request) => {
    enforceRateLimit(request, `register:${slug}`, RATE_LIMITS.registration);

    const lengthHeader = request.headers.get("content-length");
    if (!lengthHeader) {
      // Refuse streamed bodies of unknown size (browsers always send Content-Length for FormData).
      throw new AppError(411, "VALIDATION_ERROR", "The upload could not be processed. Please try again.");
    }
    if (Number(lengthHeader) > MAX_BODY_BYTES) {
      throw new AppError(413, "PAYLOAD_TOO_LARGE", "The upload is too large. Screenshots must be 5 MB or smaller.", {
        screenshot: "The screenshot must be 5 MB or smaller.",
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

    let details: unknown = null;
    const rawDetails = form.get("details");
    if (typeof rawDetails === "string") {
      try {
        details = JSON.parse(rawDetails);
      } catch {
        details = null;
      }
    }

    const screenshot = form.get("screenshot");
    const created = await createRegistration(slug, {
      details,
      utr: form.get("utr"),
      screenshot: screenshot instanceof File ? screenshot : null,
    });
    return ok(created, 201);
  });
}
