/** Wire format shared by every JSON API route and the browser API client. */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "DUPLICATE_UTR"
  | "INVALID_FILE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "REGISTRATION_CLOSED"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "NETWORK_ERROR"
  | "SERVER_ERROR";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiErrorBody };
