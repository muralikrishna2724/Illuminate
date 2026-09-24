import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { toFieldErrors } from "@/lib/validation/registration";
import type { ApiResponse } from "./api-types";
import { AppError, GENERIC_ERROR_MESSAGE, RateLimitError } from "./errors";
import { rateLimit } from "./rate-limit";
import { getClientIp } from "./request";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status, headers: NO_STORE });
}

export function fail(error: AppError, extraHeaders?: Record<string, string>): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { ok: false, error: { code: error.code, message: error.message, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) } },
    { status: error.status, headers: { ...NO_STORE, ...extraHeaders } },
  );
}

/** Converts any thrown value into a safe JSON error. Never leaks stack traces or internals. */
export function handleError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) return fail(error);
  if (error instanceof ZodError) {
    return fail(new AppError(400, "VALIDATION_ERROR", "Please check the highlighted fields.", toFieldErrors(error)));
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return fail(new AppError(404, "NOT_FOUND", "Not found."));
  }
  console.error("[api] unhandled error", error);
  return fail(new AppError(500, "SERVER_ERROR", GENERIC_ERROR_MESSAGE));
}

export function enforceRateLimit(request: Request, scope: string, cfg: { limit: number; windowMs: number }, extraKey = "") {
  const key = `${scope}:${getClientIp(request)}${extraKey ? `:${extraKey}` : ""}`;
  const result = rateLimit(key, cfg.limit, cfg.windowMs);
  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
}

type RouteContext<P> = { params: Promise<P> };

/** Wraps a route handler with uniform error handling. */
export function route<P = Record<string, never>>(
  handler: (request: Request, context: RouteContext<P>) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext<P>): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return fail(error, { "Retry-After": String(error.retryAfterSeconds) });
      }
      return handleError(error);
    }
  };
}
