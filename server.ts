import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json({ limit: "2mb" }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scheduledStoragePath = path.join(__dirname, "scheduled-emails.json");

interface OAuthPayload {
  isAuthed: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
}

interface OutreachEmailPayload {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  status: string;
  attachedResumeText?: string;
}

interface ScheduledJob {
  id: string;
  to: string;
  email: OutreachEmailPayload;
  scheduledFor: string;
  auth: OAuthPayload;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${port}/oauth2callback`;

const oauthClient = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
const oauth2Api = google.oauth2({ auth: oauthClient, version: "v2" });

const jobs = new Map<string, ScheduledJob>();
const timers = new Map<string, NodeJS.Timeout>();

const loadJobs = () => {
  if (!fs.existsSync(scheduledStoragePath)) {
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(scheduledStoragePath, "utf-8")) as ScheduledJob[];
    for (const job of data) {
      jobs.set(job.id, job);
    }
  } catch {
    // If storage is invalid, continue with an empty scheduler.
  }
};

const persistJobs = () => {
  const data = JSON.stringify([...jobs.values()], null, 2);
  fs.writeFileSync(scheduledStoragePath, data, "utf-8");
};

const buildRawEmail = (to: string, subject: string, body: string) => {
  const message = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    body
  ].join("\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const isQuotaOrAuthError = (error: unknown) => {
  const message = (error as Error)?.message ?? "";
  return /429|quota|rate limit|invalid_grant|unauthorized/i.test(message);
};

const sendWithGmail = async (to: string, email: OutreachEmailPayload, auth: OAuthPayload) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  if (!auth.accessToken && !auth.refreshToken) {
    throw new Error("Missing OAuth token payload.");
  }

  oauthClient.setCredentials({
    access_token: auth.accessToken,
    refresh_token: auth.refreshToken,
    expiry_date: auth.expiryDate
  });

  const gmail = google.gmail({ version: "v1", auth: oauthClient });
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: buildRawEmail(to, email.subject, email.body)
    }
  });
};

const executeScheduledJob = async (jobId: string) => {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  try {
    await sendWithGmail(job.to, job.email, job.auth);
  } catch {
    // Keep failed jobs for manual replay if Gmail returns quota/auth issues.
    return;
  }

  jobs.delete(jobId);
  const timer = timers.get(jobId);
  if (timer) {
    clearTimeout(timer);
  }
  timers.delete(jobId);
  persistJobs();
};

const scheduleJob = (job: ScheduledJob) => {
  const delayMs = new Date(job.scheduledFor).getTime() - Date.now();
  if (delayMs <= 0) {
    void executeScheduledJob(job.id);
    return;
  }

  const timer = setTimeout(() => {
    void executeScheduledJob(job.id);
  }, delayMs);
  timers.set(job.id, timer);
};

loadJobs();
for (const job of jobs.values()) {
  scheduleJob(job);
}
persistJobs();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, scheduledJobs: jobs.size });
});

app.get("/api/auth/google/url", (_req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ message: "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars." });
    return;
  }

  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  });

  res.json({ url });
});

app.get("/oauth2callback", (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    res.status(400).send("OAuth callback missing code.");
    return;
  }

  const escapedCode = JSON.stringify(code);
  res.setHeader("Content-Type", "text/html");
  res.send(`<!doctype html>
<html>
  <body style="font-family: sans-serif; background:#02050b; color:#e2e8f0; display:flex; min-height:100vh; align-items:center; justify-content:center;">
    <div>
      <p>Completing BulgeBracket.ai Gmail OAuth...</p>
      <p>You can close this tab once status updates in the app.</p>
    </div>
    <script>
      (function () {
        const code = ${escapedCode};
        if (window.opener) {
          window.opener.postMessage({ type: "oauth-code", code: code }, "*");
          window.close();
        }
      })();
    </script>
  </body>
</html>`);
});

app.post("/api/auth/google/callback", async (req, res) => {
  try {
    const code = req.body?.code;
    if (typeof code !== "string") {
      res.status(400).json({ message: "OAuth code is required." });
      return;
    }

    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const user = await oauth2Api.userinfo.get();

    res.json({
      isAuthed: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: user.data.email
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.post("/api/gmail/send", async (req, res) => {
  const { email, auth, to } = req.body as {
    email?: OutreachEmailPayload;
    auth?: OAuthPayload;
    to?: string;
  };

  if (!email || !auth || !to) {
    res.status(400).json({ message: "email, auth and to are required." });
    return;
  }

  try {
    await sendWithGmail(to, email, auth);
    res.json({ status: "sent" });
  } catch (error) {
    if (isQuotaOrAuthError(error)) {
      res.json({ status: "offline_fallback" });
      return;
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

app.post("/api/gmail/schedule", async (req, res) => {
  const { email, auth, to, scheduledFor } = req.body as {
    email?: OutreachEmailPayload;
    auth?: OAuthPayload;
    to?: string;
    scheduledFor?: string;
  };

  if (!email || !auth || !to || !scheduledFor) {
    res.status(400).json({ message: "email, auth, to and scheduledFor are required." });
    return;
  }

  const job: ScheduledJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    to,
    email,
    scheduledFor,
    auth
  };

  jobs.set(job.id, job);
  scheduleJob(job);
  persistJobs();

  res.json({ status: "scheduled", id: job.id });
});

app.get("/api/gmail/scheduled", (_req, res) => {
  res.json({ count: jobs.size });
});

app.listen(port, () => {
  console.log(`BulgeBracket.ai API server listening on http://localhost:${port}`);
});
