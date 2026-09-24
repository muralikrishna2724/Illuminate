import type { ApiErrorCode } from "./api-types";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** An error whose message is safe to show to the user. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string, fieldErrors?: Record<string, string>) =>
  new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
export const unauthorized = (message = "Please sign in to continue.") => new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have access to this resource.") => new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found.") => new AppError(404, "NOT_FOUND", message);
export const conflict = (message: string, code: ApiErrorCode = "CONFLICT", fieldErrors?: Record<string, string>) =>
  new AppError(409, code, message, fieldErrors);

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
    this.name = "RateLimitError";
  }
}
