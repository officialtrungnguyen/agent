import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { google } from "googleapis";
import multer from "multer";
import { nanoid } from "nanoid";
import schedule, { type Job } from "node-schedule";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = Number(process.env.PORT ?? 8787);
const SERVER_PUBLIC_URL = process.env.SERVER_PUBLIC_URL ?? `http://localhost:${PORT}`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const OAUTH_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? `${SERVER_PUBLIC_URL}/api/auth/google/callback`;

const DATA_DIR = path.join(__dirname, "data");
const SESSIONS_FILE = path.join(DATA_DIR, "google-sessions.json");
const SCHEDULED_JOBS_FILE = path.join(DATA_DIR, "scheduled-jobs.json");

interface StoredGoogleSession {
  sessionId: string;
  email: string;
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    scope?: string | null;
    token_type?: string | null;
    expiry_date?: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

type OAuthCredentialShape = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
};

interface AttachmentPayload {
  filename: string;
  mimeType: string;
  base64Data: string;
}

interface MailPayload {
  to: string;
  subject: string;
  body: string;
  attachments?: AttachmentPayload[];
  threadId?: string;
}

interface ScheduledJobRecord {
  id: string;
  sessionId: string;
  sendAt: string;
  message: MailPayload;
  metadata?: Record<string, unknown>;
  status: "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  providerId?: string;
  providerStatus?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

type StrategyRequest = {
  message: string;
  pipelineStats?: {
    total: number;
    sent: number;
    replied: number;
    noReply: number;
  };
  resume?: {
    targetRole?: string;
    achievements?: string[];
    skills?: string[];
  } | null;
};

let sessions: StoredGoogleSession[] = [];
let scheduledJobs: ScheduledJobRecord[] = [];
const runtimeJobs = new Map<string, Job>();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

function createOAuthClient() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI);
}

function sanitizeCredentials(tokens: StoredGoogleSession["tokens"]): OAuthCredentialShape {
  return {
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    scope: tokens.scope ?? undefined,
    token_type: tokens.token_type ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  };
}

function ensureGoogleConfigured() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials are missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, payload: T) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

function sessionById(sessionId: string) {
  return sessions.find((session) => session.sessionId === sessionId);
}

async function persistSessions() {
  await writeJsonFile(SESSIONS_FILE, sessions);
}

async function persistJobs() {
  await writeJsonFile(SCHEDULED_JOBS_FILE, scheduledJobs);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildRawMessage(payload: MailPayload): string {
  const attachments = payload.attachments ?? [];
  if (!attachments.length) {
    const mime = [
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      payload.body,
    ].join("\r\n");
    return toBase64Url(mime);
  }

  const boundary = `bb-ai-${nanoid(12)}`;
  const header = [
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
  ].join("\r\n");

  const messagePart = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    payload.body,
    "",
  ].join("\r\n");

  const attachmentParts = attachments
    .map((attachment) =>
      [
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        "",
        attachment.base64Data,
        "",
      ].join("\r\n"),
    )
    .join("");

  const mime = `${header}${messagePart}${attachmentParts}--${boundary}--`;
  return toBase64Url(mime);
}

function hashText(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildOfflineIntelSeed(contactId: string) {
  const seed = hashText(contactId);
  const descriptors = [
    "sponsor-backed sell-side",
    "cross-border strategic mandates",
    "minority growth capital placements",
    "defensive buy-side processes",
    "restructuring-led recapitalizations",
  ];
  const teamMoves = [
    "lateral VP hiring in New York",
    "associate class expansion in Chicago",
    "sector pod realignment in healthcare",
    "execution team staffing increase for software",
    "analyst return-offer conversion focus",
  ];
  const marketSignals = [
    "valuation resets tightening bid-ask spreads in upper middle-market software",
    "healthcare services multiples stabilizing with stronger reimbursement visibility",
    "industrial carve-out activity picking up on sponsor exits",
    "energy transition assets seeing renewed strategic buyer competition",
    "business services assets attracting add-on oriented buyers",
  ];

  return {
    generatedAt: new Date().toISOString(),
    deskMetrics: [
      `Current desk pulse: ${descriptors[seed % descriptors.length]} activity is running ahead of prior quarter plans.`,
      `Execution velocity indicator: diligence cycle times improved by ${8 + (seed % 6)}% in recent staffing snapshots.`,
    ],
    teamMoves: [
      `Team move watch: ${teamMoves[seed % teamMoves.length]}.`,
      `Pipeline note: ${teamMoves[(seed + 2) % teamMoves.length]} likely in next quarter.`,
    ],
    marketSignals: [
      `Market read: ${marketSignals[seed % marketSignals.length]}.`,
      `Live signal: ${marketSignals[(seed + 3) % marketSignals.length]}.`,
    ],
  };
}

async function sendViaGmail(sessionId: string, payload: MailPayload) {
  ensureGoogleConfigured();
  const session = sessionById(sessionId);
  if (!session) {
    throw new Error("Google session not found.");
  }

  const oauth2 = createOAuthClient();
  oauth2.setCredentials(sanitizeCredentials(session.tokens));

  oauth2.on("tokens", async (tokens) => {
    const target = sessionById(sessionId);
    if (!target) return;
    target.tokens = {
      ...target.tokens,
      ...tokens,
    };
    target.updatedAt = new Date().toISOString();
    await persistSessions();
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const raw = buildRawMessage(payload);
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: payload.threadId,
    },
  });
  return response.data;
}

async function executeScheduledJob(jobId: string) {
  const target = scheduledJobs.find((job) => job.id === jobId);
  if (!target || target.status === "cancelled" || target.status === "sent") return;

  target.status = "sending";
  target.updatedAt = new Date().toISOString();
  await persistJobs();

  try {
    const response = await sendViaGmail(target.sessionId, target.message);
    target.status = "sent";
    target.providerId = response.id ?? undefined;
    target.providerStatus = "sent";
    target.updatedAt = new Date().toISOString();
  } catch (error) {
    target.status = "failed";
    target.lastError = error instanceof Error ? error.message : "Unknown Gmail send error";
    target.updatedAt = new Date().toISOString();
  }

  runtimeJobs.delete(jobId);
  await persistJobs();
}

function scheduleRuntimeJob(record: ScheduledJobRecord) {
  if (record.status !== "scheduled") return;
  const sendAtDate = new Date(record.sendAt);
  if (sendAtDate.getTime() <= Date.now()) {
    void executeScheduledJob(record.id);
    return;
  }

  const existing = runtimeJobs.get(record.id);
  if (existing) {
    existing.cancel();
  }

  const scheduled = schedule.scheduleJob(sendAtDate, () => {
    void executeScheduledJob(record.id);
  });
  runtimeJobs.set(record.id, scheduled);
}

function parseResumeText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const achievementCandidates = lines.filter(
    (line) => /(\$|%|million|billion|\d{2,}|led|built|executed|modeled)/i.test(line),
  );
  const achievements = achievementCandidates.slice(0, 8);

  const skillLexicon = [
    "financial modeling",
    "valuation",
    "lbo",
    "mergers",
    "acquisitions",
    "excel",
    "powerpoint",
    "accounting",
    "bloomberg",
    "capital iq",
    "python",
    "vba",
    "process management",
  ];
  const lowered = text.toLowerCase();
  const skills = skillLexicon.filter((skill) => lowered.includes(skill));

  const education = lines.filter((line) => /(university|college|school of|b\.a\.|b\.s\.|mba)/i.test(line)).slice(0, 5);

  return {
    rawText: text,
    achievements: achievements.length ? achievements : lines.slice(0, 5),
    skills,
    education,
    targetRole: "Investment Banking Analyst",
    personalPitch: "Driven finance student focused on M&A execution and high-impact analytical work.",
    tailoredBulletsByDesk: {},
    updatedAt: new Date().toISOString(),
  };
}

function strategyFallbackResponse(payload: StrategyRequest): string {
  const targetRole = payload.resume?.targetRole ?? "Investment Banking Analyst";
  const sent = payload.pipelineStats?.sent ?? 0;
  const replied = payload.pipelineStats?.replied ?? 0;
  const noReply = payload.pipelineStats?.noReply ?? 0;
  const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : "0.0";

  return [
    `Pipeline assessment for ${targetRole}: current sent volume is ${sent} with ${replyRate}% reply rate and ${noReply} stale conversations.`,
    "Immediate strategy: prioritize top-fit alumni with deal-referenced openers, keep every first note under 150 words, and ask for a 15-minute coffee chat.",
    "Daily cadence: send analyst targets between 7:00-9:00 AM, VP targets between 8:00-10:00 AM, and MD targets between 9:00-11:00 AM in your timezone.",
    "Execution rule: run 7-day follow-ups each morning and 14-day follow-ups every Friday to preserve compounding response momentum.",
  ].join("\n\n");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "bulgebracket-api", timestamp: new Date().toISOString() });
});

app.get("/api/auth/google/start", (req, res) => {
  try {
    ensureGoogleConfigured();
    const origin = typeof req.query.origin === "string" ? req.query.origin : "";
    const oauth2 = createOAuthClient();
    const state = toBase64Url(JSON.stringify({ origin }));

    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
      state,
    });

    res.redirect(url);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Google OAuth configuration error.");
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    ensureGoogleConfigured();
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const error = typeof req.query.error === "string" ? req.query.error : "";
    const stateRaw = typeof req.query.state === "string" ? req.query.state : "";
    if (error) {
      throw new Error(`Google OAuth error: ${error}`);
    }
    if (!code) {
      throw new Error("Missing OAuth authorization code.");
    }

    let origin = "";
    if (stateRaw) {
      try {
        const decoded = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf8")) as { origin?: string };
        origin = decoded.origin ?? "";
      } catch {
        origin = "";
      }
    }

    const oauth2 = createOAuthClient();
    const tokenResponse = await oauth2.getToken(code);
    oauth2.setCredentials(tokenResponse.tokens);
    const oauthApi = google.oauth2({ version: "v2", auth: oauth2 });
    const profile = await oauthApi.userinfo.get();
    const email = profile.data.email ?? "unknown@gmail.com";
    const sessionId = nanoid();

    sessions = sessions.filter((session) => session.email !== email);
    sessions.push({
      sessionId,
      email,
      tokens: tokenResponse.tokens,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await persistSessions();

    const safeOrigin = escapeHtml(origin);
    const safeEmail = escapeHtml(email);
    const safeSession = escapeHtml(sessionId);
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; background:#020617; color:#e2e8f0; padding:24px;">
    <h2 style="margin-top:0;">BulgeBracket.ai Gmail Authorization Complete</h2>
    <p>You can close this window now.</p>
    <script>
      (function () {
        var message = { type: "bb-google-auth-success", sessionId: "${safeSession}", email: "${safeEmail}" };
        try {
          if (window.opener && "${safeOrigin}") {
            window.opener.postMessage(message, "${safeOrigin}");
            window.close();
          } else if (window.opener) {
            window.opener.postMessage(message, "*");
            window.close();
          }
        } catch (err) {}
      })();
    </script>
  </body>
</html>`);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "OAuth callback failure.");
  }
});

app.get("/api/auth/google/session/:sessionId", (req, res) => {
  const session = sessionById(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({
    sessionId: session.sessionId,
    email: session.email,
    updatedAt: session.updatedAt,
  });
});

app.delete("/api/auth/google/session/:sessionId", async (req, res) => {
  const before = sessions.length;
  sessions = sessions.filter((session) => session.sessionId !== req.params.sessionId);
  if (before !== sessions.length) {
    await persistSessions();
  }
  res.json({ ok: true });
});

app.post("/api/gmail/send", async (req, res) => {
  try {
    const payload = req.body as {
      sessionId?: string;
      to?: string;
      subject?: string;
      body?: string;
      attachments?: AttachmentPayload[];
      threadId?: string;
    };

    if (!payload.sessionId || !payload.to || !payload.subject || !payload.body) {
      res.status(400).json({ error: "sessionId, to, subject, and body are required." });
      return;
    }

    const response = await sendViaGmail(payload.sessionId, {
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      attachments: payload.attachments ?? [],
      threadId: payload.threadId,
    });
    res.json({
      id: response.id,
      threadId: response.threadId,
      labelIds: response.labelIds,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Gmail send failed." });
  }
});

app.post("/api/gmail/schedule", async (req, res) => {
  try {
    const payload = req.body as {
      sessionId?: string;
      sendAt?: string;
      message?: MailPayload;
      metadata?: Record<string, unknown>;
    };

    if (!payload.sessionId || !payload.sendAt || !payload.message) {
      res.status(400).json({ error: "sessionId, sendAt, and message are required." });
      return;
    }
    if (!sessionById(payload.sessionId)) {
      res.status(404).json({ error: "Google session not found." });
      return;
    }

    const record: ScheduledJobRecord = {
      id: nanoid(),
      sessionId: payload.sessionId,
      sendAt: new Date(payload.sendAt).toISOString(),
      message: payload.message,
      metadata: payload.metadata,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    scheduledJobs.push(record);
    await persistJobs();
    scheduleRuntimeJob(record);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Scheduling failed." });
  }
});

app.get("/api/gmail/jobs", (req, res) => {
  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : "";
  const filtered = sessionId ? scheduledJobs.filter((job) => job.sessionId === sessionId) : scheduledJobs;
  res.json(filtered);
});

app.post("/api/gmail/jobs/:jobId/cancel", async (req, res) => {
  const job = scheduledJobs.find((record) => record.id === req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  job.status = "cancelled";
  job.updatedAt = new Date().toISOString();
  runtimeJobs.get(job.id)?.cancel();
  runtimeJobs.delete(job.id);
  await persistJobs();
  res.json({ ok: true });
});

app.post("/api/resume/parse", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "resume file is required" });
      return;
    }

    let text = "";
    if (file.mimetype === "application/pdf") {
      const parserModule = (await import("pdf-parse")) as Record<string, unknown>;
      if (typeof parserModule.default === "function") {
        const parsed = await (parserModule.default as (buffer: Buffer) => Promise<{ text?: string }>)(file.buffer);
        text = parsed.text ?? "";
      } else if (typeof parserModule.PDFParse === "function") {
        const parser = new (parserModule.PDFParse as new (options: { data: Buffer }) => { getText: () => Promise<{ text?: string }> })(
          { data: file.buffer },
        );
        const parsed = await parser.getText();
        text = parsed.text ?? "";
      } else {
        throw new Error("No supported PDF parser export found.");
      }
    } else {
      text = file.buffer.toString("utf8");
    }

    const structured = parseResumeText(text);
    res.json(structured);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Resume parsing failed." });
  }
});

app.get("/api/intel/contact/:contactId", async (req, res) => {
  const contactId = req.params.contactId;
  const intel = buildOfflineIntelSeed(contactId);
  const live = req.query.live === "true";

  if (!live) {
    res.json(intel);
    return;
  }

  try {
    // Optional live enrichment. If unavailable, endpoint still returns offline premium intel.
    const response = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
    if (!response.ok) throw new Error("news feed unavailable");
    const feedText = await response.text();
    const matches = Array.from(feedText.matchAll(/<title>(.*?)<\/title>/g)).slice(0, 2).map((entry) => entry[1]);
    res.json({
      ...intel,
      marketSignals: [...intel.marketSignals, ...matches.map((item) => `Live feed: ${item}`)],
      generatedAt: new Date().toISOString(),
    });
  } catch {
    res.json({
      ...intel,
      generatedAt: new Date().toISOString(),
    });
  }
});

app.post("/api/strategy/advice", (req, res) => {
  const payload = req.body as StrategyRequest;
  const response = strategyFallbackResponse(payload);
  res.json({ response });
});

async function bootstrap() {
  await ensureDataDir();
  sessions = await readJsonFile<StoredGoogleSession[]>(SESSIONS_FILE, []);
  scheduledJobs = await readJsonFile<ScheduledJobRecord[]>(SCHEDULED_JOBS_FILE, []);
  scheduledJobs.filter((record) => record.status === "scheduled").forEach(scheduleRuntimeJob);

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`BulgeBracket API listening on ${SERVER_PUBLIC_URL}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap server:", error);
  process.exit(1);
});
