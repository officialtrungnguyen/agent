import type { GmailAuthState } from "@/types";

export interface GmailStatusResponse {
  configured: boolean;
  connected: boolean;
  email?: string;
  expiresAt?: number;
}

export async function fetchGmailStatus(): Promise<GmailStatusResponse> {
  try {
    const r = await fetch("/api/gmail/status", { cache: "no-store" });
    return (await r.json()) as GmailStatusResponse;
  } catch {
    return { configured: false, connected: false };
  }
}

/**
 * Open the Google OAuth popup with robust handling: requests the consent URL,
 * opens a centered popup, and listens for the postMessage from the callback.
 * Resolves with the connected state. Falls back to opening in a new tab.
 */
export async function connectGmail(): Promise<
  { ok: boolean; email?: string; error?: string; configured: boolean; url?: string }
> {
  let auth: { configured: boolean; url?: string; message?: string };
  try {
    const r = await fetch("/api/gmail/auth", { cache: "no-store" });
    auth = await r.json();
  } catch {
    return { ok: false, configured: false, error: "Could not reach auth endpoint." };
  }

  if (!auth.configured || !auth.url) {
    return { ok: false, configured: false, error: auth.message };
  }

  const url = auth.url;
  const w = 520;
  const h = 640;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(
    url,
    "bb-gmail-oauth",
    `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no`,
  );

  return new Promise((resolve) => {
    let settled = false;
    const finish = (payload: { ok: boolean; email?: string; error?: string }) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMsg);
      clearInterval(poll);
      resolve({ ...payload, configured: true, url });
    };

    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.source === "bb-gmail") {
        finish({ ok: !!e.data.ok, email: e.data.email, error: e.data.error });
      }
    };
    window.addEventListener("message", onMsg);

    // If popup blocked, surface the URL so the UI can offer "Open in new tab".
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      finish({ ok: false, error: "popup_blocked" });
      return;
    }

    // Poll for popup close (user may close without completing).
    const poll = setInterval(async () => {
      if (popup.closed) {
        // Re-check status — they may have completed before the message landed.
        const status = await fetchGmailStatus();
        if (status.connected) finish({ ok: true, email: status.email });
        else finish({ ok: false, error: "closed" });
      }
    }, 700);
  });
}

export async function disconnectGmail(): Promise<void> {
  try {
    await fetch("/api/gmail/disconnect", { method: "POST" });
  } catch {
    /* ignore */
  }
}

export interface SendArgs {
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; mimeType: string; base64: string };
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

export async function sendGmail(args: SendArgs): Promise<SendResult> {
  try {
    const r = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const data = await r.json();
    if (!r.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${r.status}` };
    }
    return { ok: true, messageId: data.messageId, threadId: data.threadId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network_error" };
  }
}

export function toGmailAuthState(s: GmailStatusResponse): GmailAuthState {
  return { connected: s.connected, email: s.email, expiresAt: s.expiresAt };
}
