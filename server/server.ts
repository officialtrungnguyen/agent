import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  `http://localhost:${PORT}/api/auth/google/callback`;

const TOKEN_PATH = path.join(process.cwd(), ".gmail-tokens.json");

app.use(cors({ origin: [FRONTEND_URL, "http://localhost:5173"], credentials: true }));
app.use(express.json());

interface StoredTokens {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  email?: string;
}

function loadTokens(): StoredTokens | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")) as StoredTokens;
    }
  } catch {
    /* empty */
  }
  return null;
}

function saveTokens(tokens: StoredTokens): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function getGmailClient(tokens: StoredTokens) {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2 });
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/userinfo.email",
];

app.get("/api/auth/google/url", (_req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.json({
      url: null,
      error:
        "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env — demo mode uses mock send.",
      demo: true,
    });
  }
  const oauth2 = getOAuth2Client();
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.json({ url });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).send("Missing code");
  }
  try {
    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    const oauth2user = google.oauth2({ version: "v2", auth: oauth2 });
    const profile = await oauth2user.userinfo.get();
    const stored: StoredTokens = {
      access_token: tokens.access_token ?? undefined,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
      email: profile.data.email ?? undefined,
    };
    saveTokens(stored);

    res.send(
      `<html><body style="font-family:system-ui;padding:2rem"><h2>Gmail connected</h2><p>You can close this window and return to BulgeBracket.ai.</p><script>window.close()</script></body></html>`
    );
  } catch (e) {
    res.status(500).send(`Auth failed: ${e instanceof Error ? e.message : "error"}`);
  }
});

app.get("/api/gmail/status", (_req, res) => {
  const tokens = loadTokens();
  res.json({
    connected: Boolean(tokens?.refresh_token || tokens?.access_token),
    email: tokens?.email,
    demo: !CLIENT_ID,
  });
});

function buildRawMessage(
  to: string,
  subject: string,
  body: string,
  attachText?: string
): string {
  const boundary = "bb_boundary_" + Date.now();
  let message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ];

  if (attachText) {
    const b64 = Buffer.from(attachText).toString("base64");
    message = message.concat([
      `--${boundary}`,
      'Content-Type: text/plain; name="tailored-resume.txt"',
      "Content-Transfer-Encoding: base64",
      'Content-Disposition: attachment; filename="tailored-resume.txt"',
      "",
      b64,
    ]);
  }

  message.push(`--${boundary}--`);
  const raw = message.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendViaGmail(
  to: string,
  subject: string,
  body: string,
  scheduledFor?: string,
  attachResumeText?: string
): Promise<{ success: boolean; messageId?: string; scheduled?: boolean }> {
  const tokens = loadTokens();

  if (!tokens?.access_token && !tokens?.refresh_token) {
    if (scheduledFor) {
      console.info("[demo] Scheduled email", { to, subject, scheduledFor });
      return { success: true, messageId: `demo-scheduled-${Date.now()}`, scheduled: true };
    }
    console.info("[demo] Sent email", { to, subject });
    return { success: true, messageId: `demo-${Date.now()}` };
  }

  const gmail = getGmailClient(tokens);
  const raw = buildRawMessage(to, subject, body, attachResumeText);

  if (scheduledFor) {
    const sendAt = new Date(scheduledFor).getTime();
    if (sendAt > Date.now()) {
      const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });
      return {
        success: true,
        messageId: result.data.id ?? undefined,
        scheduled: true,
      };
    }
  }

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { success: true, messageId: result.data.id ?? undefined };
}

app.post("/api/gmail/send", async (req, res) => {
  const { to, subject, body, scheduledFor, attachResumeText } = req.body as {
    to: string;
    subject: string;
    body: string;
    scheduledFor?: string;
    attachResumeText?: string;
  };

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const result = await sendViaGmail(
      to,
      subject,
      body,
      scheduledFor,
      attachResumeText
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : "Send failed",
    });
  }
});

app.post("/api/gmail/pipeline", async (req, res) => {
  const { items } = req.body as {
    items: {
      to: string;
      subject: string;
      body: string;
      scheduledFor?: string;
      attachResumeText?: string;
    }[];
  };

  const results: { success: boolean; index: number }[] = [];
  for (let i = 0; i < (items?.length ?? 0); i++) {
    const item = items[i]!;
    try {
      const r = await sendViaGmail(
        item.to,
        item.subject,
        item.body,
        item.scheduledFor,
        item.attachResumeText
      );
      results.push({ success: r.success, index: i });
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      results.push({ success: false, index: i });
    }
  }
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`BulgeBracket API on http://localhost:${PORT}`);
});
