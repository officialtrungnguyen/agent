import { DraftEmail, GmailAuthState, ParsedResume, QueueItem, UserProfile } from "../types";
import { toBase64Url } from "../lib/utils";

const GMAIL_SCOPE = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
  "profile"
].join(" ");

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
            error_callback?: (error: unknown) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export function gmailClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

export function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[src='https://accounts.google.com/gsi/client']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function requestGmailAccess(): Promise<GmailAuthState> {
  const clientId = gmailClientId();
  if (!clientId) {
    throw new Error("Set VITE_GOOGLE_CLIENT_ID to enable real Gmail OAuth.");
  }

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPE,
      callback: async (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "Google OAuth did not return an access token."));
          return;
        }

        const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${response.access_token}`
          }
        }).then((result) => result.json());

        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          email: profile.email,
          connected: true
        });
      },
      error_callback: (error) => reject(error instanceof Error ? error : new Error("OAuth popup was blocked."))
    });

    tokenClient?.requestAccessToken({ prompt: "consent" });
  });
}

function buildMimeMessage(
  to: string,
  from: UserProfile,
  draft: DraftEmail,
  resume?: ParsedResume
) {
  const boundary = `bb-ai-${crypto.randomUUID()}`;
  const fromHeader = from.email ? `${from.name || "Candidate"} <${from.email}>` : from.name || "Candidate";
  const plainBody = draft.body;

  if (!draft.attachResume || !resume?.fileDataUrl) {
    return [
      `To: ${to}`,
      `From: ${fromHeader}`,
      `Subject: ${draft.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      plainBody
    ].join("\r\n");
  }

  const base64 = resume.fileDataUrl.split(",")[1] ?? "";
  const mimeType = resume.fileType || "application/octet-stream";
  const fileName = resume.fileName || "resume.pdf";

  return [
    `To: ${to}`,
    `From: ${fromHeader}`,
    `Subject: ${draft.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    plainBody,
    "",
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${fileName}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${fileName}"`,
    "",
    base64,
    "",
    `--${boundary}--`
  ].join("\r\n");
}

export async function sendGmailMessage(
  accessToken: string,
  to: string,
  from: UserProfile,
  draft: DraftEmail,
  resume?: ParsedResume
) {
  const raw = toBase64Url(buildMimeMessage(to, from, draft, resume));
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail send failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<{ id: string; threadId: string; labelIds?: string[] }>;
}

export async function scheduleOnServer(item: QueueItem, profile: UserProfile, accessToken?: string) {
  if (!accessToken || !item.scheduledFor) return;

  await fetch("/api/gmail/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      item,
      profile,
      accessToken
    })
  }).catch(() => {
    // Client-side scheduler remains authoritative when the optional server is not running.
  });
}

export function isTokenFresh(gmail: GmailAuthState) {
  return Boolean(gmail.connected && gmail.accessToken && gmail.expiresAt && gmail.expiresAt > Date.now() + 60_000);
}
