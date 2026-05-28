import { Router } from "express";
import { google } from "googleapis";

export const gmailRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const API_PORT = Number(process.env.PORT || 8787);
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${API_PORT}/auth/google/callback`;

interface ScheduledItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  scheduledFor: number;
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    scope?: string | null;
    token_type?: string | null;
    id_token?: string | null;
  };
  attachment?: {
    filename: string;
    mimeType: string;
    base64: string;
  };
  status: "pending" | "sent" | "failed";
  error?: string;
  sentAt?: number;
  messageId?: string;
  threadId?: string;
}

const queue = new Map<string, ScheduledItem>();

setInterval(() => void tick(), 15_000);

async function tick() {
  const now = Date.now();
  for (const item of queue.values()) {
    if (item.status !== "pending") continue;
    if (item.scheduledFor > now) continue;
    try {
      const result = await sendNow(item);
      item.status = "sent";
      item.sentAt = Date.now();
      item.error = undefined;
      item.messageId = result.id ?? undefined;
      item.threadId = result.threadId ?? undefined;
    } catch (err: unknown) {
      item.status = "failed";
      item.error = err instanceof Error ? err.message : String(err);
    }
  }
}

function buildAuthClient(tokens: ScheduledItem["tokens"]) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Gmail OAuth is not configured on the server (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  client.setCredentials({
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
    scope: tokens.scope ?? undefined,
    token_type: tokens.token_type ?? undefined,
    id_token: tokens.id_token ?? undefined,
  });
  return client;
}

function buildRawEmail(args: {
  to: string;
  from?: string;
  subject: string;
  body: string;
  attachment?: { filename: string; mimeType: string; base64: string };
}): string {
  const boundary = "bb_" + Math.random().toString(36).slice(2);
  const headers: string[] = [
    `To: ${args.to}`,
    `Subject: ${encodeHeader(args.subject)}`,
    "MIME-Version: 1.0",
  ];
  if (args.from) headers.unshift(`From: ${args.from}`);
  let mime: string;
  if (args.attachment) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    mime = headers.join("\r\n") + "\r\n\r\n" +
      `--${boundary}\r\n` +
      "Content-Type: text/plain; charset=UTF-8\r\n" +
      "Content-Transfer-Encoding: 7bit\r\n\r\n" +
      args.body + "\r\n\r\n" +
      `--${boundary}\r\n` +
      `Content-Type: ${args.attachment.mimeType}; name="${args.attachment.filename}"\r\n` +
      `Content-Disposition: attachment; filename="${args.attachment.filename}"\r\n` +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      chunkBase64(args.attachment.base64) + "\r\n" +
      `--${boundary}--`;
  } else {
    headers.push("Content-Type: text/plain; charset=UTF-8");
    mime = headers.join("\r\n") + "\r\n\r\n" + args.body;
  }
  return Buffer.from(mime).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeHeader(s: string): string {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

function chunkBase64(b64: string): string {
  return b64.replace(/[^A-Za-z0-9+/=]/g, "").replace(/(.{76})/g, "$1\r\n");
}

async function sendNow(item: Pick<ScheduledItem, "to" | "subject" | "body" | "tokens" | "attachment">) {
  const auth = buildAuthClient(item.tokens);
  const gmail = google.gmail({ version: "v1", auth });
  let profileEmail: string | undefined;
  try {
    const p = await gmail.users.getProfile({ userId: "me" });
    profileEmail = p.data.emailAddress || undefined;
  } catch {
    /* ignore */
  }
  const raw = buildRawEmail({
    to: item.to,
    from: profileEmail,
    subject: item.subject,
    body: item.body,
    attachment: item.attachment,
  });
  const r = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return { id: r.data.id, threadId: r.data.threadId };
}

gmailRouter.post("/send", async (req, res) => {
  try {
    const { to, subject, body, tokens, attachment } = req.body || {};
    if (!to || !subject || !body || !tokens) {
      return res.status(400).json({ error: "missing_fields" });
    }
    const result = await sendNow({ to, subject, body, tokens, attachment });
    res.json({ ok: true, messageId: result.id, threadId: result.threadId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

gmailRouter.post("/schedule", (req, res) => {
  const { to, subject, body, tokens, attachment, scheduledFor } = req.body || {};
  if (!to || !subject || !body || !tokens || !scheduledFor) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const id = "q_" + Math.random().toString(36).slice(2, 10);
  queue.set(id, {
    id,
    to,
    subject,
    body,
    tokens,
    attachment,
    scheduledFor: Number(scheduledFor),
    status: "pending",
  });
  res.json({ ok: true, id, scheduledFor });
});

gmailRouter.get("/queue", (_req, res) => {
  res.json({
    items: Array.from(queue.values()).map((i) => ({
      id: i.id,
      to: i.to,
      subject: i.subject,
      scheduledFor: i.scheduledFor,
      status: i.status,
      sentAt: i.sentAt,
      error: i.error,
    })),
  });
});

gmailRouter.delete("/queue/:id", (req, res) => {
  const id = req.params.id;
  const ok = queue.delete(id);
  res.json({ ok });
});

gmailRouter.post("/check-replies", async (req, res) => {
  try {
    const { tokens, threadIds } = req.body || {};
    if (!tokens || !Array.isArray(threadIds)) {
      return res.status(400).json({ error: "missing_fields" });
    }
    const auth = buildAuthClient(tokens);
    const gmail = google.gmail({ version: "v1", auth });
    const results: Array<{ threadId: string; replied: boolean; lastFrom?: string; lastAt?: number }> = [];
    for (const tid of threadIds.slice(0, 50)) {
      try {
        const t = await gmail.users.threads.get({ userId: "me", id: tid, format: "metadata" });
        const msgs = t.data.messages || [];
        const last = msgs[msgs.length - 1];
        const headers = last?.payload?.headers || [];
        const from = headers.find((h) => h.name === "From")?.value || "";
        const dateStr = headers.find((h) => h.name === "Date")?.value || "";
        const lastAt = dateStr ? Date.parse(dateStr) : undefined;
        results.push({
          threadId: tid,
          replied: msgs.length > 1,
          lastFrom: from,
          lastAt: Number.isFinite(lastAt) ? lastAt : undefined,
        });
      } catch {
        results.push({ threadId: tid, replied: false });
      }
    }
    res.json({ results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});
