import type { GmailAuthState, OutreachEmail } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Request failed");
  }

  return (await response.json()) as T;
};

export const api = {
  async getGoogleAuthUrl() {
    return request<{ url: string }>("/api/auth/google/url", { method: "GET" });
  },
  async exchangeAuthCode(code: string) {
    return request<GmailAuthState>("/api/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ code })
    });
  },
  async sendEmail(email: OutreachEmail, auth: GmailAuthState, to: string) {
    return request<{ status: "sent" | "offline_fallback" }>("/api/gmail/send", {
      method: "POST",
      body: JSON.stringify({ email, auth, to })
    });
  },
  async scheduleEmail(email: OutreachEmail, auth: GmailAuthState, to: string, scheduledFor: string) {
    return request<{ status: "scheduled" | "offline_scheduled"; id: string }>("/api/gmail/schedule", {
      method: "POST",
      body: JSON.stringify({ email, auth, to, scheduledFor })
    });
  },
  async getScheduledJobs() {
    return request<{ count: number }>("/api/gmail/scheduled", { method: "GET" });
  }
};
