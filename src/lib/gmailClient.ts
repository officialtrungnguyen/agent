interface Tokens {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}

interface Attachment {
  filename: string;
  mimeType: string;
  base64: string;
}

interface SendArgs {
  to: string;
  subject: string;
  body: string;
  tokens: unknown;
  attachment?: Attachment;
}

interface ScheduleArgs extends SendArgs {
  scheduledFor: number;
}

export async function gmailSend(args: SendArgs): Promise<{ messageId?: string; threadId?: string }> {
  const r = await fetch("/api/gmail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Gmail send failed (${r.status}): ${t}`);
  }
  return r.json();
}

export async function gmailSchedule(args: ScheduleArgs): Promise<{ id: string }> {
  const r = await fetch("/api/gmail/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Schedule failed (${r.status}): ${t}`);
  }
  return r.json();
}

export async function gmailQueue(): Promise<{ items: Array<{ id: string; to: string; subject: string; scheduledFor: number; status: string; sentAt?: number; error?: string; }> }> {
  const r = await fetch("/api/gmail/queue");
  if (!r.ok) return { items: [] };
  return r.json();
}

export async function gmailCancel(id: string): Promise<{ ok: boolean }> {
  const r = await fetch(`/api/gmail/queue/${id}`, { method: "DELETE" });
  if (!r.ok) return { ok: false };
  return r.json();
}

export async function gmailCheckReplies(tokens: Tokens, threadIds: string[]) {
  const r = await fetch("/api/gmail/check-replies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens, threadIds }),
  });
  if (!r.ok) return { results: [] };
  return r.json();
}

export function startGoogleOAuth(): Promise<{ tokens: unknown; profile: { email?: string; name?: string; picture?: string } }> {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      "/auth/google/start",
      "bb_oauth",
      "width=540,height=720,menubar=no,toolbar=no,location=no,status=no"
    );
    if (!popup) {
      // Fallback: open in current tab
      window.location.href = "/auth/google/start";
      reject(new Error("Popup blocked — opening in this tab. Please re-launch the connect flow."));
      return;
    }
    const TIMEOUT_MS = 5 * 60 * 1000;
    const started = Date.now();
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.source !== "bulgebracket-oauth") return;
      cleanup();
      resolve({ tokens: data.payload.tokens, profile: data.payload.profile });
    };
    const interval = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        // Last-resort: check localStorage in case the postMessage was missed
        try {
          const raw = window.localStorage.getItem("bb_oauth_payload");
          if (raw) {
            window.localStorage.removeItem("bb_oauth_payload");
            const payload = JSON.parse(raw);
            resolve({ tokens: payload.tokens, profile: payload.profile });
            return;
          }
        } catch { /* noop */ }
        reject(new Error("OAuth popup was closed before completion."));
      } else if (Date.now() - started > TIMEOUT_MS) {
        cleanup();
        try { popup.close(); } catch { /* noop */ }
        reject(new Error("OAuth timed out. Try again."));
      }
    }, 600);
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(interval);
    };
    window.addEventListener("message", onMessage);
  });
}
