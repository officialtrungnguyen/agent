import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const storePath = resolve("data/scheduled-emails.json");
const maxTimeout = 2_147_000_000;

interface Attachment {
  fileName: string;
  mimeType: string;
  base64: string;
}

interface GmailPayload {
  id: string;
  accessToken: string;
  refreshToken?: string;
  to: string;
  subject: string;
  body: string;
  scheduledFor?: string;
  attachment?: Attachment;
}

interface StoredSchedule extends GmailPayload {
  scheduledFor: string;
  createdAt: string;
}

app.use(cors());
app.use(express.json({ limit: "18mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, scheduler: "ready" });
});

app.post("/api/gmail/send", async (request, response) => {
  try {
    const payload = request.body as GmailPayload;
    validatePayload(payload);
    const result = await sendViaGmail(payload);
    response.json({ ok: true, result });
  } catch (error) {
    response.status(400).send(error instanceof Error ? error.message : "Unable to send email");
  }
});

app.post("/api/gmail/schedule", (request, response) => {
  try {
    const payload = request.body as GmailPayload;
    validatePayload(payload);
    if (!payload.scheduledFor) throw new Error("scheduledFor is required for scheduling");
    const schedule: StoredSchedule = {
      ...payload,
      scheduledFor: payload.scheduledFor,
      createdAt: new Date().toISOString()
    };
    const schedules = loadSchedules().filter((item) => item.id !== schedule.id).concat(schedule);
    saveSchedules(schedules);
    armSchedule(schedule);
    response.json({ ok: true, scheduledFor: schedule.scheduledFor });
  } catch (error) {
    response.status(400).send(error instanceof Error ? error.message : "Unable to schedule email");
  }
});

function validatePayload(payload: GmailPayload) {
  if (!payload.accessToken && !payload.refreshToken && !process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("A Gmail OAuth access token or configured refresh token is required");
  }
  if (!payload.to || !payload.subject || !payload.body) {
    throw new Error("to, subject, and body are required");
  }
}

async function sendViaGmail(payload: GmailPayload) {
  const accessToken = await resolveAccessToken(payload);
  const raw = buildRfc2822(payload);
  const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });
  if (!gmailResponse.ok) {
    const body = await gmailResponse.text();
    throw new Error(`Gmail API send failed (${gmailResponse.status}): ${body}`);
  }
  return gmailResponse.json();
}

async function resolveAccessToken(payload: GmailPayload) {
  const refreshToken = payload.refreshToken ?? process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) return payload.accessToken;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return payload.accessToken;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!tokenResponse.ok) return payload.accessToken;
  const tokenBody = (await tokenResponse.json()) as { access_token?: string };
  return tokenBody.access_token ?? payload.accessToken;
}

function buildRfc2822(payload: GmailPayload) {
  const boundary = `bb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `To: ${payload.to}`,
    `Subject: ${encodeHeader(payload.subject)}`,
    "MIME-Version: 1.0",
    payload.attachment ? `Content-Type: multipart/mixed; boundary="${boundary}"` : "Content-Type: text/plain; charset=utf-8"
  ];

  const message = payload.attachment
    ? [
        ...headers,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: 7bit",
        "",
        payload.body,
        "",
        `--${boundary}`,
        `Content-Type: ${payload.attachment.mimeType}; name="${payload.attachment.fileName}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${payload.attachment.fileName}"`,
        "",
        payload.attachment.base64,
        `--${boundary}--`
      ].join("\r\n")
    : [...headers, "", payload.body].join("\r\n");

  return Buffer.from(message).toString("base64url");
}

function encodeHeader(value: string) {
  return /[^\x00-\x7F]/.test(value) ? `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=` : value;
}

function loadSchedules(): StoredSchedule[] {
  if (!existsSync(storePath)) return [];
  return JSON.parse(readFileSync(storePath, "utf8")) as StoredSchedule[];
}

function saveSchedules(schedules: StoredSchedule[]) {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(schedules, null, 2));
}

function armSchedule(schedule: StoredSchedule) {
  const delay = new Date(schedule.scheduledFor).getTime() - Date.now();
  if (delay <= 0) {
    void executeSchedule(schedule);
    return;
  }
  setTimeout(() => armSchedule(schedule), Math.min(delay, maxTimeout));
}

async function executeSchedule(schedule: StoredSchedule) {
  try {
    await sendViaGmail(schedule);
  } finally {
    saveSchedules(loadSchedules().filter((item) => item.id !== schedule.id));
  }
}

loadSchedules().forEach(armSchedule);

app.listen(port, () => {
  console.log(`BulgeBracket.ai Gmail scheduler listening on ${port}`);
});
