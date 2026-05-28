// ─────────────────────────────────────────────────────────────
// BulgeBracket.ai — Express backend
//
// Responsibilities:
//   • Real Google OAuth 2.0 (Gmail send scope)
//   • Real Gmail REST API sending (RFC 2822 MIME, optional attachment)
//   • True server-side scheduling (held + dispatched at scheduledFor)
//   • Optional live AI enrichment (OpenAI-compatible), with the frontend
//     always falling back to its premium offline engine.
//
// Tokens are stored per-session in memory (single-user dev tool). For a
// multi-user deployment, swap the in-memory maps for a real store.
// ─────────────────────────────────────────────────────────────

import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import crypto from "node:crypto";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT || 8787);
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

// ── In-memory session + token store ──────────────────────────
interface SessionTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
}
interface Session {
  id: string;
  tokens?: SessionTokens;
  profile?: { email?: string; name?: string; picture?: string };
}
const sessions = new Map<string, Session>();
const oauthStateMap = new Map<string, string>(); // state -> sessionId

// ── Scheduled / sent queue (server-authoritative) ────────────
interface QueueRecord {
  id: string;
  sessionId: string;
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; contentBase64: string } | null;
  scheduledFor?: number | null; // epoch ms
  status: "scheduled" | "sending" | "sent" | "delivered" | "failed";
  createdAt: number;
  sentAt?: number | null;
  error?: string | null;
  gmailId?: string;
  threadId?: string;
}
const queue = new Map<string, QueueRecord>();

// ── App setup ────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(
  cors({
    origin: [APP_ORIGIN, "http://localhost:5173", "http://localhost:8787"],
    credentials: true,
  }),
);

// Lightweight cookie-based session (no external dep).
const COOKIE = "bb_sid";
function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || "";
  const out: Record<string, string> = {};
  header.split(";").forEach((p) => {
    const idx = p.indexOf("=");
    if (idx > -1) out[p.slice(0, idx).trim()] = decodeURIComponent(p.slice(idx + 1).trim());
  });
  return out;
}

function getSession(req: Request, res: Response): Session {
  const cookies = parseCookies(req);
  let sid = cookies[COOKIE];
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomUUID();
    sessions.set(sid, { id: sid });
    res.setHeader(
      "Set-Cookie",
      `${COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
    );
  }
  return sessions.get(sid)!;
}

function makeOAuthClient() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// ── Auth routes ──────────────────────────────────────────────
app.get("/api/auth/status", (req, res) => {
  const session = getSession(req, res);
  const t = session.tokens;
  const connected = Boolean(t?.access_token || t?.refresh_token);
  res.json({
    configured: isGoogleConfigured,
    connected,
    email: session.profile?.email,
    name: session.profile?.name,
    picture: session.profile?.picture,
    expiresAt: t?.expiry_date ?? undefined,
  });
});

app.get("/api/auth/google/url", (req, res) => {
  if (!isGoogleConfigured) {
    return res.status(503).json({ error: "Google OAuth is not configured on the server." });
  }
  const session = getSession(req, res);
  const state = crypto.randomBytes(16).toString("hex");
  oauthStateMap.set(state, session.id);
  const client = makeOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
  res.json({ url });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const sessionId = state ? oauthStateMap.get(state) : undefined;
  if (!code || !sessionId) {
    return res.status(400).send(renderPopupClose(false, "Missing code or state."));
  }
  oauthStateMap.delete(state!);
  const session = sessions.get(sessionId);
  if (!session) return res.status(400).send(renderPopupClose(false, "Session expired."));

  try {
    const client = makeOAuthClient();
    const { tokens } = await client.getToken(code);
    session.tokens = tokens as SessionTokens;
    client.setCredentials(tokens);
    // Fetch profile
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const me = await oauth2.userinfo.get();
    session.profile = {
      email: me.data.email ?? undefined,
      name: me.data.name ?? undefined,
      picture: me.data.picture ?? undefined,
    };
    res.setHeader("Content-Type", "text/html");
    res.send(renderPopupClose(true));
  } catch (e) {
    res.status(500).send(renderPopupClose(false, (e as Error).message));
  }
});

app.post("/api/auth/logout", (req, res) => {
  const session = getSession(req, res);
  session.tokens = undefined;
  session.profile = undefined;
  res.json({ ok: true });
});

function renderPopupClose(success: boolean, message = ""): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>BulgeBracket.ai</title>
  <style>body{font-family:Inter,system-ui,sans-serif;background:#15181d;color:#f6f7f8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
  .card{text-align:center;padding:32px 40px;border:1px solid #3a414b;border-radius:12px;background:#23282f}
  .ok{color:#5bd08a}.err{color:#f08a8a}</style></head>
  <body><div class="card">
  <h2 class="${success ? "ok" : "err"}">${success ? "Gmail Connected" : "Connection Failed"}</h2>
  <p>${success ? "You can close this window and return to BulgeBracket.ai." : message}</p>
  </div>
  <script>
    try { window.opener && window.opener.postMessage({ type: "bulgebracket-oauth", success: ${success} }, "*"); } catch (e) {}
    setTimeout(function(){ window.close(); }, ${success ? 900 : 4000});
  </script></body></html>`;
}

// ── Gmail send + schedule ────────────────────────────────────
async function authedGmail(session: Session) {
  if (!session.tokens) throw new Error("Not connected to Gmail.");
  const client = makeOAuthClient();
  client.setCredentials(session.tokens);
  // Refresh if needed (googleapis handles automatically on call, but persist new tokens).
  client.on("tokens", (tokens) => {
    session.tokens = { ...session.tokens, ...tokens } as SessionTokens;
  });
  return google.gmail({ version: "v1", auth: client });
}

function buildMime(opts: {
  from?: string;
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; contentBase64: string } | null;
}): string {
  const { to, subject, body, attachment } = opts;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const headers = [
    opts.from ? `From: ${opts.from}` : "",
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
  ].filter(Boolean);

  if (!attachment) {
    return [
      ...headers,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
    ].join("\r\n");
  }

  const boundary = `bb_${crypto.randomBytes(8).toString("hex")}`;
  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
    "",
    `--${boundary}`,
    `Content-Type: application/octet-stream; name="${attachment.filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    "",
    attachment.contentBase64.replace(/.{76}/g, "$&\r\n"),
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

function toBase64Url(raw: string): string {
  return Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function dispatch(record: QueueRecord): Promise<void> {
  const session = sessions.get(record.sessionId);
  if (!session) {
    record.status = "failed";
    record.error = "Session no longer available.";
    return;
  }
  try {
    record.status = "sending";
    const gmail = await authedGmail(session);
    const mime = buildMime({
      from: session.profile?.email,
      to: record.to,
      subject: record.subject,
      body: record.body,
      attachment: record.attachment,
    });
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: toBase64Url(mime) },
    });
    record.status = "sent";
    record.sentAt = Date.now();
    record.gmailId = result.data.id ?? undefined;
    record.threadId = result.data.threadId ?? undefined;
  } catch (e) {
    record.status = "failed";
    record.error = (e as Error).message;
  }
}

app.post("/api/gmail/send", async (req, res) => {
  const session = getSession(req, res);
  if (!isGoogleConfigured) {
    return res.status(503).json({ ok: false, error: "Gmail is not configured on the server. Add Google OAuth credentials to enable real sending." });
  }
  if (!session.tokens) {
    return res.status(401).json({ ok: false, error: "Not connected to Gmail. Click Connect Gmail first." });
  }
  const { to, subject, body, scheduledFor, attachResume, resumeFileName, resumeContentBase64, clientRef } =
    req.body as {
      to?: string;
      subject?: string;
      body?: string;
      scheduledFor?: string | null;
      attachResume?: boolean;
      resumeFileName?: string;
      resumeContentBase64?: string;
      clientRef?: string;
    };

  if (!to || !subject || !body) {
    return res.status(400).json({ ok: false, error: "Missing to, subject, or body." });
  }

  const attachment =
    attachResume && resumeContentBase64
      ? { filename: resumeFileName || "resume.pdf", contentBase64: resumeContentBase64 }
      : null;

  const id = clientRef || crypto.randomUUID();
  const scheduledMs = scheduledFor ? new Date(scheduledFor).getTime() : null;

  const record: QueueRecord = {
    id,
    sessionId: session.id,
    to,
    subject,
    body,
    attachment,
    scheduledFor: scheduledMs,
    status: "scheduled",
    createdAt: Date.now(),
    sentAt: null,
    error: null,
  };
  queue.set(id, record);

  // Send now if no future schedule.
  if (!scheduledMs || scheduledMs <= Date.now() + 1500) {
    await dispatch(record);
    return res.json({
      ok: record.status === "sent",
      id: record.gmailId,
      threadId: record.threadId,
      scheduled: false,
      error: record.error ?? undefined,
    });
  }

  return res.json({
    ok: true,
    scheduled: true,
    scheduledFor: new Date(scheduledMs).toISOString(),
    id,
  });
});

app.get("/api/gmail/queue", (req, res) => {
  const session = getSession(req, res);
  const items: Record<string, { status: string; sentAt?: string; error?: string; scheduledFor?: string }> = {};
  for (const rec of queue.values()) {
    if (rec.sessionId !== session.id) continue;
    items[rec.id] = {
      status: rec.status,
      sentAt: rec.sentAt ? new Date(rec.sentAt).toISOString() : undefined,
      error: rec.error ?? undefined,
      scheduledFor: rec.scheduledFor ? new Date(rec.scheduledFor).toISOString() : undefined,
    };
  }
  res.json({ items });
});

app.post("/api/gmail/cancel", (req, res) => {
  const session = getSession(req, res);
  const { id } = req.body as { id?: string };
  const rec = id ? queue.get(id) : undefined;
  if (rec && rec.sessionId === session.id && rec.status === "scheduled") {
    queue.delete(id!);
    return res.json({ ok: true });
  }
  res.status(404).json({ ok: false, error: "Not found or already sent." });
});

// Scheduler tick — dispatch any due scheduled records every 20s.
setInterval(() => {
  const now = Date.now();
  for (const rec of queue.values()) {
    if (rec.status === "scheduled" && rec.scheduledFor && rec.scheduledFor <= now) {
      void dispatch(rec);
    }
  }
}, 20_000);

// ── Optional live AI bridge ──────────────────────────────────
app.post("/api/ai/generate", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({ ok: false, reason: "offline", text: null });
  }
  const { task, payload } = req.body as { task?: string; payload?: Record<string, unknown> };
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are an elite investment banking recruiting coach. Write concise, Wall Street-appropriate networking content. Keep emails under 150 words.",
          },
          { role: "user", content: `Task: ${task}\nContext: ${JSON.stringify(payload).slice(0, 6000)}` },
        ],
      }),
    });
    if (!r.ok) {
      // Quota/429 or other — frontend falls back gracefully.
      return res.json({ ok: false, reason: `upstream_${r.status}`, text: null });
    }
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? null;
    res.json({ ok: Boolean(text), text });
  } catch (e) {
    res.json({ ok: false, reason: (e as Error).message, text: null });
  }
});

// ── Health ───────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    googleConfigured: isGoogleConfigured,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    time: new Date().toISOString(),
  });
});

// 404 for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] error:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n  BulgeBracket.ai API on http://localhost:${PORT}`);
  console.log(`  Google OAuth configured: ${isGoogleConfigured ? "yes" : "no (offline-friendly)"}`);
  console.log(`  Live AI configured:      ${process.env.OPENAI_API_KEY ? "yes" : "no (premium offline engine)"}\n`);
});
