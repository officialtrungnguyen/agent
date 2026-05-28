// ─────────────────────────────────────────────────────────────
// Gmail client — talks to the Express backend (server/server.ts)
//
// Real Google OAuth + Gmail REST API send. Scheduling is handled
// server-side (the API holds queued sends and dispatches at the
// scheduled time). If the backend isn't configured with Google
// credentials, /api/auth/status reports `configured: false` and the
// UI shows a clear setup path — there is no fake/mailto fallback for
// *sending*, but the rest of the app remains fully functional.
// ─────────────────────────────────────────────────────────────

import type { GmailAuthState } from "../types";

export interface AuthStatus extends GmailAuthState {
  configured: boolean;
}

export interface SendPayload {
  to: string;
  subject: string;
  body: string;
  attachResume?: boolean;
  resumeFileName?: string;
  resumeContentBase64?: string; // data without prefix
  scheduledFor?: string | null; // ISO; null/absent = send now
  clientRef?: string; // queue item id for reconciliation
}

export interface SendResult {
  ok: boolean;
  id?: string;
  threadId?: string;
  scheduled?: boolean;
  scheduledFor?: string;
  error?: string;
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch("/api/auth/status", { credentials: "include" });
    if (!res.ok) throw new Error("status failed");
    return await json<AuthStatus>(res);
  } catch {
    return { configured: false, connected: false };
  }
}

/** Returns the Google OAuth consent URL to open in a popup/new tab. */
export async function getAuthUrl(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/google/url", { credentials: "include" });
    if (!res.ok) return null;
    const data = await json<{ url: string }>(res);
    return data.url ?? null;
  } catch {
    return null;
  }
}

export async function disconnectGmail(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    /* ignore */
  }
}

export async function sendEmail(payload: SendPayload): Promise<SendResult> {
  try {
    const res = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await json<SendResult>(res);
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return data;
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Poll the server for the live status of scheduled/sent items. */
export async function getQueueStatus(): Promise<Record<string, { status: string; sentAt?: string; error?: string }>> {
  try {
    const res = await fetch("/api/gmail/queue", { credentials: "include" });
    if (!res.ok) return {};
    const data = await json<{ items: Record<string, { status: string; sentAt?: string; error?: string }> }>(res);
    return data.items ?? {};
  } catch {
    return {};
  }
}

/**
 * Opens the OAuth flow in a popup and resolves when auth completes.
 * Falls back to instructing the caller to open in a new tab if the
 * popup is blocked.
 */
export function openOAuthPopup(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const width = 520;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      url,
      "bulgebracket_oauth",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`,
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // Popup blocked — caller should offer "Open in new tab".
      resolve(false);
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "bulgebracket-oauth") {
        window.removeEventListener("message", onMessage);
        clearInterval(timer);
        try {
          popup.close();
        } catch {
          /* ignore */
        }
        resolve(Boolean(event.data.success));
      }
    };
    window.addEventListener("message", onMessage);

    // Fallback: detect popup close, then re-check status.
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener("message", onMessage);
        resolve(true); // caller will re-fetch status to confirm
      }
    }, 700);
  });
}
