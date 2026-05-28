import cors from "cors";
import express from "express";
import { google } from "googleapis";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type GmailAttachment = {
  filename: string;
  mimeType: string;
  contentBase64: string;
};

type StoredQueueItem = {
  id: string;
  to: string;
  subject: string;
  body: string;
  scheduledFor: string;
  label?: string;
  contactId?: string;
  contactName?: string;
  attachments?: GmailAttachment[];
  status: "Queued" | "Scheduled" | "Sent" | "Delivered" | "Failed";
  error?: string;
};

type StoredTokens = {
  tokens: Record<string, unknown>;
  email?: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8787);
const serverOrigin = process.env.SERVER_ORIGIN ?? `http://localhost:${port}`;
const defaultClientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const storeDir = resolve(process.cwd(), ".bulgebracket-store");
const authFile = resolve(storeDir, "google-auth.json");
const queueFile = resolve(storeDir, "gmail-queue.json");
const distClientDir = resolve(process.cwd(), "dist/client");

if (!existsSync(storeDir)) mkdirSync(storeDir, { recursive: true });
if (!existsSync(queueFile)) writeFileSync(queueFile, "[]", "utf8");

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));

const ensureEnv = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }
  return { clientId, clientSecret };
};

const readJson = <T,>(path: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (path: string, value: unknown) => {
  writeFileSync(path, JSON.stringify(value, null, 2), "utf8");
};

const getRedirectUri = () => process.env.GOOGLE_REDIRECT_URI ?? `${serverOrigin}/api/auth/google/callback`;

const getOAuthClient = () => {
  const { clientId, clientSecret } = ensureEnv();
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
};

const getStoredAuth = () => readJson<StoredTokens | null>(authFile, null);
const setStoredAuth = (value: StoredTokens) => writeJson(authFile, value);
const getQueue = () => readJson<StoredQueueItem[]>(queueFile, []);
const setQueue = (queue: StoredQueueItem[]) => writeJson(queueFile, queue);

const buildMessage = ({
  to,
  subject,
  body,
  attachments = [],
}: {
  to: string;
  subject: string;
  body: string;
  attachments?: GmailAttachment[];
}) => {
  const boundary = `bbai-${Date.now()}`;
  const attachmentBlocks = attachments
    .map(
      (attachment) =>
        `--${boundary}\r\n` +
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n` +
        `Content-Disposition: attachment; filename="${attachment.filename}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${attachment.contentBase64}\r\n`,
    )
    .join("");

  const message =
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    "MIME-Version: 1.0\r\n" +
    `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: text/plain; charset="UTF-8"\r\n' +
    "Content-Transfer-Encoding: 7bit\r\n\r\n" +
    `${body}\r\n\r\n` +
    `${attachmentBlocks}` +
    `--${boundary}--`;

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const withAuthorizedClient = async () => {
  const stored = getStoredAuth();
  if (!stored?.tokens) {
    throw new Error("Google OAuth has not been completed yet.");
  }

  const client = getOAuthClient();
  client.setCredentials(stored.tokens);
  client.on("tokens", (tokens) => {
    setStoredAuth({
      ...stored,
      tokens: {
        ...stored.tokens,
        ...tokens,
      },
    });
  });

  if (!stored.email) {
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const profile = await oauth2.userinfo.get();
    setStoredAuth({
      tokens: stored.tokens,
      email: profile.data.email ?? undefined,
    });
  }

  return client;
};

const sendMessage = async (item: StoredQueueItem) => {
  const auth = await withAuthorizedClient();
  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: buildMessage({
        to: item.to,
        subject: item.subject,
        body: item.body,
        attachments: item.attachments,
      }),
    },
  });
};

const processQueue = async () => {
  const queue = getQueue();
  const now = Date.now();
  let mutated = false;

  for (const item of queue) {
    if (item.status !== "Scheduled") continue;
    if (new Date(item.scheduledFor).getTime() > now) continue;

    try {
      await sendMessage(item);
      item.status = "Sent";
      item.error = undefined;
      mutated = true;
    } catch (error) {
      item.status = "Failed";
      item.error = error instanceof Error ? error.message : "Unknown Gmail scheduling error";
      mutated = true;
    }
  }

  if (mutated) setQueue(queue);
};

setInterval(() => {
  void processQueue();
}, 20_000);

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/auth/status", async (_request, response) => {
  const stored = getStoredAuth();
  if (!stored?.tokens) {
    response.json({ connected: false });
    return;
  }

  try {
    const auth = await withAuthorizedClient();
    const gmail = google.gmail({ version: "v1", auth });
    const profile = await gmail.users.getProfile({ userId: "me" });
    response.json({
      connected: true,
      email: profile.data.emailAddress ?? stored.email,
      scopes: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
    });
  } catch (error) {
    response.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : "Unable to validate Gmail auth.",
    });
  }
});

app.get("/api/auth/google", (request, response) => {
  try {
    const client = getOAuthClient();
    const origin =
      typeof request.query.origin === "string" && request.query.origin.length > 0
        ? request.query.origin
        : defaultClientOrigin;

    const state = Buffer.from(JSON.stringify({ origin })).toString("base64url");
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      state,
    });

    response.redirect(url);
  } catch (error) {
    response.status(500).send(error instanceof Error ? error.message : "Unable to start Google OAuth.");
  }
});

app.get("/api/auth/google/callback", async (request, response) => {
  const code = request.query.code;
  const rawState = typeof request.query.state === "string" ? request.query.state : "";
  const parsedState = rawState ? JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")) : {};
  const origin = parsedState.origin ?? defaultClientOrigin;

  if (typeof code !== "string") {
    response.status(400).send("Missing OAuth code.");
    return;
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const profile = await oauth2.userinfo.get();
    setStoredAuth({
      tokens: tokens as Record<string, unknown>,
      email: profile.data.email ?? undefined,
    });

    response.send(`
      <html>
        <body style="font-family: sans-serif; background: #020617; color: #e2e8f0; display:flex; align-items:center; justify-content:center; min-height:100vh;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "bulgebracket-auth", success: true }, ${JSON.stringify(origin)});
              window.close();
            } else {
              window.location = ${JSON.stringify(origin)};
            }
          </script>
          Gmail connected. You can close this tab.
        </body>
      </html>
    `);
  } catch (error) {
    response.send(`
      <html>
        <body style="font-family: sans-serif; background: #020617; color: #e2e8f0; display:flex; align-items:center; justify-content:center; min-height:100vh;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "bulgebracket-auth", success: false }, ${JSON.stringify(origin)});
            }
          </script>
          ${error instanceof Error ? error.message : "OAuth exchange failed."}
        </body>
      </html>
    `);
  }
});

app.get("/api/gmail/queue", (_request, response) => {
  response.json(getQueue());
});

app.get("/api/gmail/replies", async (_request, response) => {
  try {
    const auth = await withAuthorizedClient();
    const gmail = google.gmail({ version: "v1", auth });
    const list = await gmail.users.messages.list({
      userId: "me",
      q: "in:inbox newer_than:30d",
      maxResults: 15,
    });
    response.json(list.data.messages ?? []);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unable to read Gmail inbox." });
  }
});

app.post("/api/gmail/send", async (request, response) => {
  const item: StoredQueueItem = {
    id: `send-${Date.now()}`,
    to: request.body.to,
    subject: request.body.subject,
    body: request.body.body,
    scheduledFor: new Date().toISOString(),
    label: request.body.label,
    contactId: request.body.contactId,
    contactName: request.body.contactName,
    attachments: request.body.attachments ?? [],
    status: "Sent",
  };

  try {
    await sendMessage(item);
    const queue = getQueue();
    queue.unshift(item);
    setQueue(queue);
    response.json(item);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Gmail send failed." });
  }
});

app.post("/api/gmail/schedule", (request, response) => {
  const item: StoredQueueItem = {
    id: `scheduled-${Date.now()}`,
    to: request.body.to,
    subject: request.body.subject,
    body: request.body.body,
    scheduledFor: request.body.scheduledFor,
    label: request.body.label,
    contactId: request.body.contactId,
    contactName: request.body.contactName,
    attachments: request.body.attachments ?? [],
    status: "Scheduled",
  };
  const queue = getQueue();
  queue.unshift(item);
  setQueue(queue);
  response.json(item);
});

if (existsSync(distClientDir)) {
  app.use(express.static(distClientDir));
  app.get("*", (_request, response) => {
    response.sendFile(resolve(distClientDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`BulgeBracket.ai server running on ${serverOrigin}`);
});
