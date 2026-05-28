/**
 * Gmail integration.
 *
 * Implements full Google OAuth 2.0 flow + Gmail REST API send + true scheduling
 * (delayed send via in-memory queue that fires at the scheduled time and
 * persists across server restart via a tiny on-disk store).
 *
 * If GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured, the routes
 * fall back to a clearly-labeled "simulated send" mode so the rest of the app
 * never feels broken — but the client UI surfaces the warning so the user
 * knows to add credentials in the Cursor dashboard.
 */

import { google, type gmail_v1 } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { env, HAS_GOOGLE_OAUTH } from "./env.js";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const TOKEN_DIR = path.join(process.cwd(), ".bb_data");
const TOKEN_FILE = path.join(TOKEN_DIR, "gmail-tokens.json");
const QUEUE_FILE = path.join(TOKEN_DIR, "schedule-queue.json");
const HISTORY_FILE = path.join(TOKEN_DIR, "send-history.json");

interface StoredTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
  email?: string;
  name?: string;
  picture?: string;
  connectedAt?: string;
}

interface ScheduledItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachmentName?: string;
  attachmentBase64?: string;
  scheduledFor: string;
  contactId: string;
  variant: string;
  createdAt: string;
}

interface HistoryEntry {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  status: "sent" | "scheduled" | "failed";
  threadId?: string;
  messageId?: string;
  contactId: string;
  failureReason?: string;
  simulated?: boolean;
}

function ensureDir() {
  if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function loadTokens(): StoredTokens | null {
  const data = readJson<StoredTokens | null>(TOKEN_FILE, null);
  return data && data.access_token ? data : null;
}

function saveTokens(t: StoredTokens) {
  writeJson(TOKEN_FILE, t);
}

export function clearTokens() {
  if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
}

export function buildOAuthClient() {
  if (!HAS_GOOGLE_OAUTH) return null;
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function generateAuthUrl(state: string): string | null {
  const client = buildOAuthClient();
  if (!client) return null;
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
    state,
  });
}

export async function exchangeCode(code: string) {
  const client = buildOAuthClient();
  if (!client) throw new Error("OAuth not configured");
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens as any);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const profile = await oauth2.userinfo.get();

  const stored: StoredTokens = {
    ...tokens,
    email: profile.data.email ?? undefined,
    name: profile.data.name ?? undefined,
    picture: profile.data.picture ?? undefined,
    connectedAt: new Date().toISOString(),
  };
  saveTokens(stored);
  return stored;
}

function toCredentials(t: StoredTokens) {
  return {
    access_token: t.access_token ?? undefined,
    refresh_token: t.refresh_token ?? undefined,
    scope: t.scope ?? undefined,
    token_type: t.token_type ?? undefined,
    expiry_date: t.expiry_date ?? undefined,
  };
}

export async function authedGmail(): Promise<gmail_v1.Gmail | null> {
  const client = buildOAuthClient();
  if (!client) return null;
  const tokens = loadTokens();
  if (!tokens) return null;
  client.setCredentials(toCredentials(tokens));

  client.on("tokens", (t) => {
    const merged = { ...tokens, ...t } as StoredTokens;
    saveTokens(merged);
  });

  return google.gmail({ version: "v1", auth: client });
}

function buildRawMessage({
  to,
  from,
  subject,
  body,
  attachmentName,
  attachmentBase64,
}: {
  to: string;
  from: string;
  subject: string;
  body: string;
  attachmentName?: string;
  attachmentBase64?: string;
}): string {
  const boundary = "----=_BulgeBracket_" + Math.random().toString(36).slice(2);
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];

  if (attachmentBase64 && attachmentName) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    const message =
      headers.join("\r\n") +
      "\r\n\r\n" +
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset="UTF-8"\r\n` +
      `Content-Transfer-Encoding: 7bit\r\n\r\n` +
      body +
      "\r\n\r\n" +
      `--${boundary}\r\n` +
      `Content-Type: application/octet-stream; name="${attachmentName}"\r\n` +
      `Content-Disposition: attachment; filename="${attachmentName}"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      attachmentBase64 +
      "\r\n\r\n" +
      `--${boundary}--`;
    return Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  headers.push('Content-Type: text/plain; charset="UTF-8"');
  headers.push("Content-Transfer-Encoding: 7bit");
  const message = headers.join("\r\n") + "\r\n\r\n" + body;
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface SendParams {
  to: string;
  subject: string;
  body: string;
  attachmentName?: string;
  attachmentBase64?: string;
  contactId: string;
  variant: string;
}

export async function sendEmailNow(params: SendParams): Promise<HistoryEntry> {
  const tokens = loadTokens();
  const gmail = await authedGmail();
  if (!gmail || !tokens?.email) {
    const entry: HistoryEntry = {
      id: cryptoId(),
      to: params.to,
      subject: params.subject,
      sentAt: new Date().toISOString(),
      status: "sent",
      contactId: params.contactId,
      simulated: true,
    };
    appendHistory(entry);
    return entry;
  }

  try {
    const raw = buildRawMessage({
      to: params.to,
      from: tokens.email,
      subject: params.subject,
      body: params.body,
      attachmentName: params.attachmentName,
      attachmentBase64: params.attachmentBase64,
    });
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
    const entry: HistoryEntry = {
      id: cryptoId(),
      to: params.to,
      subject: params.subject,
      sentAt: new Date().toISOString(),
      status: "sent",
      contactId: params.contactId,
      threadId: res.data.threadId ?? undefined,
      messageId: res.data.id ?? undefined,
    };
    appendHistory(entry);
    return entry;
  } catch (err) {
    const entry: HistoryEntry = {
      id: cryptoId(),
      to: params.to,
      subject: params.subject,
      sentAt: new Date().toISOString(),
      status: "failed",
      contactId: params.contactId,
      failureReason: err instanceof Error ? err.message : String(err),
    };
    appendHistory(entry);
    throw err;
  }
}

function cryptoId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-6)
  );
}

export function readQueue(): ScheduledItem[] {
  return readJson<ScheduledItem[]>(QUEUE_FILE, []);
}
function writeQueue(items: ScheduledItem[]) {
  writeJson(QUEUE_FILE, items);
}

export function scheduleEmail(params: SendParams & { scheduledFor: string }): ScheduledItem {
  const item: ScheduledItem = {
    id: cryptoId(),
    to: params.to,
    subject: params.subject,
    body: params.body,
    attachmentName: params.attachmentName,
    attachmentBase64: params.attachmentBase64,
    scheduledFor: params.scheduledFor,
    contactId: params.contactId,
    variant: params.variant,
    createdAt: new Date().toISOString(),
  };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return item;
}

export function cancelScheduled(id: string): boolean {
  const queue = readQueue();
  const next = queue.filter((q) => q.id !== id);
  writeQueue(next);
  return next.length !== queue.length;
}

export function readHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_FILE, []);
}
function appendHistory(entry: HistoryEntry) {
  const list = readHistory();
  list.unshift(entry);
  writeJson(HISTORY_FILE, list.slice(0, 1000));
}

let dispatcherStarted = false;
export function startSchedulerDispatcher() {
  if (dispatcherStarted) return;
  dispatcherStarted = true;
  setInterval(async () => {
    const now = Date.now();
    const queue = readQueue();
    if (queue.length === 0) return;
    const due = queue.filter((q) => new Date(q.scheduledFor).getTime() <= now);
    if (due.length === 0) return;
    const remaining = queue.filter((q) => new Date(q.scheduledFor).getTime() > now);
    writeQueue(remaining);
    for (const item of due) {
      try {
        await sendEmailNow({
          to: item.to,
          subject: item.subject,
          body: item.body,
          attachmentName: item.attachmentName,
          attachmentBase64: item.attachmentBase64,
          contactId: item.contactId,
          variant: item.variant,
        });
      } catch (err) {
        console.error("[scheduler] send failed:", err);
      }
    }
  }, 15_000);
}
