import type { Contact, DraftEmail, GmailIdentity, UserResume } from "@/types";

/**
 * Thin fetch wrapper for the BulgeBracket.ai backend.
 * Every call gracefully falls back so the UI never breaks if the server is offline.
 */

const BASE = ""; // same-origin (Vite proxy handles /api and /auth)

interface JsonError {
  error: string;
  message?: string;
}

async function jsonOrNull<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  async health() {
    try {
      const res = await fetch(`${BASE}/api/health`);
      return jsonOrNull<{
        ok: boolean;
        features: { gmailOAuthConfigured: boolean; openAiConfigured: boolean };
      }>(res);
    } catch {
      return null;
    }
  },

  async gmailStatus() {
    try {
      const res = await fetch(`${BASE}/auth/google/status`);
      return jsonOrNull<{
        configured: boolean;
        connected: boolean;
        identity: GmailIdentity | null;
      }>(res);
    } catch {
      return { configured: false, connected: false, identity: null };
    }
  },

  async gmailStartUrl(state = "/") {
    try {
      const res = await fetch(`${BASE}/auth/google/start?format=json&state=${encodeURIComponent(state)}`);
      if (!res.ok) {
        const data = await jsonOrNull<JsonError>(res);
        return { url: null, error: data?.message ?? data?.error ?? "Could not start OAuth" };
      }
      const data = await jsonOrNull<{ url: string }>(res);
      return { url: data?.url ?? null, error: null as string | null };
    } catch (err) {
      return { url: null, error: err instanceof Error ? err.message : "network_error" };
    }
  },

  async gmailDisconnect() {
    try {
      await fetch(`${BASE}/auth/google/disconnect`, { method: "POST" });
    } catch {
      // best-effort
    }
  },

  async gmailSend(payload: {
    to: string;
    subject: string;
    body: string;
    attachmentName?: string;
    attachmentBase64?: string;
    contactId: string;
    variant: string;
  }) {
    try {
      const res = await fetch(`${BASE}/api/gmail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrNull<{ ok: boolean; entry?: unknown; error?: string }>(res);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "network_error" };
    }
  },

  async gmailSchedule(payload: {
    to: string;
    subject: string;
    body: string;
    attachmentName?: string;
    attachmentBase64?: string;
    contactId: string;
    variant: string;
    scheduledFor: string;
  }) {
    try {
      const res = await fetch(`${BASE}/api/gmail/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrNull<{ ok: boolean; item?: unknown; error?: string }>(res);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "network_error" };
    }
  },

  async gmailQueue() {
    try {
      const res = await fetch(`${BASE}/api/gmail/queue`);
      return jsonOrNull<{ queue: unknown[] }>(res);
    } catch {
      return { queue: [] };
    }
  },

  async gmailCancel(id: string) {
    try {
      const res = await fetch(`${BASE}/api/gmail/queue/${id}/cancel`, { method: "POST" });
      return jsonOrNull<{ ok: boolean }>(res);
    } catch {
      return { ok: false };
    }
  },

  async aiEmail(payload: {
    variant: "short" | "relationship" | "deal" | "aggressive";
    resume: Partial<UserResume> & { userName?: string; pitch?: string };
    contact: {
      fullName: string;
      firstName: string;
      firm: string;
      title: string;
      seniority: string;
      desk: string;
      city: string;
      coverage: string[];
      school: string;
      recentDeals: { target: string; acquirer?: string; value: string; product: string }[];
      interests?: string[];
    };
  }) {
    try {
      const res = await fetch(`${BASE}/api/ai/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrNull<{ subject: string; body: string; offline: boolean }>(res);
    } catch {
      return null;
    }
  },

  async aiIntel(payload: { contact: Contact }) {
    try {
      const res = await fetch(`${BASE}/api/ai/intel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrNull<{
        highlights: string[];
        teamMoves: string[];
        deskMetrics: { label: string; value: string }[];
        icebreakers: string[];
        offline: boolean;
      }>(res);
    } catch {
      return null;
    }
  },

  async aiAdvisor(payload: {
    history: { role: "user" | "assistant"; content: string }[];
    resume?: Partial<UserResume> & { userName?: string };
    pipelineSummary?: string;
  }) {
    try {
      const res = await fetch(`${BASE}/api/ai/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return jsonOrNull<{ reply: string; offline: boolean }>(res);
    } catch {
      return null;
    }
  },
};

export function buildLinkedInUrl(firstName: string, lastName: string, firm: string, school: string) {
  const keywords = `${firstName} ${lastName} ${firm} ${school}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function buildGoogleSearchUrl(firstName: string, lastName: string, firm: string, school: string) {
  const keywords = `"${firstName} ${lastName}" "${firm}" "${school}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(keywords)}`;
}

export type { DraftEmail };
