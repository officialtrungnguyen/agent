import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

/**
 * Server-side Gmail helpers. Uses real Google OAuth2 + Gmail REST API.
 * Configure via env:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI (optional; otherwise derived from request origin)
 */

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export const TOKEN_COOKIE = "bb_gmail_tokens";

export function gmailConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/gmail/callback`;
}

export function createOAuthClient(origin: string): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(origin),
  );
}

export interface StoredTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  email?: string | null;
}

/** Build a raw RFC 2822 message (base64url) with optional PDF attachment. */
export function buildRawMessage(opts: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; mimeType: string; base64: string };
}): string {
  const { from, to, subject, body, attachment } = opts;
  const boundary = "bb_boundary_" + Math.random().toString(36).slice(2);
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];

  let message: string;
  if (attachment) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    message = [
      headers.join("\r\n"),
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
      "",
      `--${boundary}`,
      `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      attachment.base64.replace(/(.{76})/g, "$1\r\n"),
      "",
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    message = [headers.join("\r\n"), "", body].join("\r\n");
  }

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
