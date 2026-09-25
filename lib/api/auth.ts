import { apiRequest } from "./client";

export type LoginRole = "admin" | "participant";

export const authApi = {
  /** `secret` is an admin password or a participant's registration ID. */
  login(email: string, secret: string) {
    return apiRequest<{ role: LoginRole; redirectTo: string }>("/api/auth/login", { method: "POST", json: { email, secret } });
  },
  logout() {
    return apiRequest<{ signedOut: true }>("/api/auth/logout", { method: "POST", json: {} });
  },
};
