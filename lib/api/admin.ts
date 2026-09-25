import type { DashboardStats, EventSlug, Paginated, Payment, PaymentStatus, Quiz, QuizAccessRule, RegistrationDetail, RegistrationSummary } from "@/types/domain";
import { apiRequest, apiUrl, NETWORK_ERROR, SERVER_ERROR } from "./client";
import type { ApiResponse } from "@/lib/http/api-types";

export interface RegistrationQuery {
  event?: EventSlug;
  status?: PaymentStatus;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const adminApi = {
  stats() {
    return apiRequest<DashboardStats>("/api/admin/stats", { cache: "no-store" });
  },
  listRegistrations(query: RegistrationQuery, signal?: AbortSignal) {
    return apiRequest<Paginated<RegistrationSummary>>("/api/admin/registrations", {
      query: { ...query },
      cache: "no-store",
      signal,
    });
  },
  getRegistration(registrationId: string) {
    return apiRequest<RegistrationDetail>(`/api/admin/registrations/${encodeURIComponent(registrationId)}`, { cache: "no-store" });
  },
  verifyPayment(paymentId: string) {
    return apiRequest<Payment>(`/api/admin/payments/${encodeURIComponent(paymentId)}/verify`, { method: "POST", json: {} });
  },
  rejectPayment(paymentId: string, reason: string) {
    return apiRequest<Payment>(`/api/admin/payments/${encodeURIComponent(paymentId)}/reject`, {
      method: "POST",
      json: { reason: reason.trim() || undefined },
    });
  },
  getQuiz() {
    return apiRequest<Quiz>("/api/admin/quiz", { cache: "no-store" });
  },
  updateQuiz(input: { quizLink: string; enabled: boolean; accessRule: QuizAccessRule }) {
    return apiRequest<Quiz>("/api/admin/quiz", { method: "PUT", json: input });
  },
  /** Downloads the filtered CSV export and triggers a browser download. */
  async exportCsv(query: Omit<RegistrationQuery, "page" | "pageSize">): Promise<ApiResponse<{ filename: string }>> {
    let response: Response;
    try {
      response = await fetch(apiUrl("/api/admin/export", { ...query }), { credentials: "same-origin", cache: "no-store" });
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }
    if (!response.ok) {
      try {
        const body = (await response.json()) as ApiResponse<never>;
        if (!body.ok) return body;
      } catch {
        // ignore
      }
      return { ok: false, error: SERVER_ERROR };
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "illuminate-registrations.csv";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, data: { filename } };
  },
};
