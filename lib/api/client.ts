import type { ApiErrorBody, ApiResponse } from "@/lib/http/api-types";

/**
 * Centralised browser API client. Components never call `fetch` directly;
 * they use the typed service functions in lib/api/*.ts, which all resolve to
 * an `ApiResponse<T>` (never throw), covering validation, server and network
 * errors uniformly.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export const NETWORK_ERROR: ApiErrorBody = {
  code: "NETWORK_ERROR",
  message: "We couldn't reach the server. Please check your connection and try again.",
};

export const SERVER_ERROR: ApiErrorBody = {
  code: "SERVER_ERROR",
  message: "Something went wrong. Please try again.",
};

export function apiUrl(path: string, query?: Record<string, string | number | undefined | null>): string {
  const url = `${BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return typeof value === "object" && value !== null && "ok" in value;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined | null>; json?: unknown } = {},
): Promise<ApiResponse<T>> {
  const { query, json, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(apiUrl(path, query), {
      credentials: "same-origin",
      ...rest,
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  try {
    const body: unknown = await response.json();
    if (isApiResponse<T>(body)) return body;
  } catch {
    // fall through
  }
  return { ok: false, error: response.status === 429 ? { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." } : SERVER_ERROR };
}

/**
 * Multipart upload with progress reporting (fetch cannot report upload
 * progress, so this uses XMLHttpRequest).
 */
export function apiUpload<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl(path));
    xhr.responseType = "text";
    xhr.setRequestHeader("Accept", "application/json");
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
    }
    xhr.onload = () => {
      try {
        const body: unknown = JSON.parse(xhr.responseText);
        if (isApiResponse<T>(body)) return resolve(body);
      } catch {
        // fall through
      }
      if (xhr.status === 413) {
        return resolve({
          ok: false,
          error: { code: "PAYLOAD_TOO_LARGE", message: "The upload is too large.", fieldErrors: { screenshot: "The screenshot must be 4 MB or smaller." } },
        });
      }
      resolve({ ok: false, error: SERVER_ERROR });
    };
    xhr.onerror = () => resolve({ ok: false, error: NETWORK_ERROR });
    xhr.ontimeout = () => resolve({ ok: false, error: NETWORK_ERROR });
    xhr.timeout = 120_000;
    xhr.send(form);
  });
}
