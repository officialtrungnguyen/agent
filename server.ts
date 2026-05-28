import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { PDFParse } from 'pdf-parse';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface AttachmentPayload {
  fileName: string;
  mimeType: string;
  base64Content: string;
}

interface SendPayload {
  to: string;
  subject: string;
  body: string;
  sendAt?: string;
  attachment?: AttachmentPayload;
}

interface ScheduledJob {
  id: string;
  payload: SendPayload;
  status: 'scheduled' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const port = Number(process.env.PORT ?? 8787);
const dataDir = path.resolve(__dirname, 'server-data');
const tokenPath = path.resolve(dataDir, 'google-token.json');
const jobsPath = path.resolve(dataDir, 'scheduled-jobs.json');
const distPath = path.resolve(__dirname, 'dist');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

function createOAuthClient() {
  if (!googleConfigured()) {
    throw new Error('Google OAuth environment variables are not configured.');
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

async function ensureServerData() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(jobsPath);
  } catch {
    await fs.writeFile(jobsPath, '[]');
  }
}

async function loadTokens(): Promise<Credentials | null> {
  try {
    const raw = await fs.readFile(tokenPath, 'utf8');
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: Credentials) {
  await ensureServerData();
  await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
}

async function getAuthorizedClient() {
  const client = createOAuthClient();
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error('Gmail OAuth has not been completed yet.');
  }
  client.setCredentials(tokens);
  client.on('tokens', (updatedTokens) => {
    void saveTokens({ ...tokens, ...updatedTokens });
  });
  return client;
}

function getAuthUrl() {
  if (!googleConfigured()) {
    return undefined;
  }

  return createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'openid',
      'email',
      'profile',
    ],
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildRawEmail({ to, subject, body, attachment }: SendPayload) {
  const senderName = process.env.GMAIL_SENDER_NAME ?? 'BulgeBracket.ai';
  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111827;">${escapeHtml(body).replace(/\n/g, '<br/>')}</div>`;

  if (!attachment) {
    const message = [
      `From: ${senderName}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      bodyHtml,
    ].join('\r\n');

    return Buffer.from(message).toString('base64url');
  }

  const boundary = `bbai-${Date.now()}`;
  const message = [
    `From: ${senderName}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    bodyHtml,
    '',
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${attachment.fileName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachment.fileName}"`,
    '',
    attachment.base64Content.match(/.{1,76}/g)?.join('\r\n') ?? attachment.base64Content,
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(message).toString('base64url');
}

async function sendEmail(payload: SendPayload) {
  const auth = await getAuthorizedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = buildRawEmail(payload);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data;
}

async function loadJobs(): Promise<ScheduledJob[]> {
  await ensureServerData();
  const raw = await fs.readFile(jobsPath, 'utf8');
  return JSON.parse(raw) as ScheduledJob[];
}

async function saveJobs(jobs: ScheduledJob[]) {
  await ensureServerData();
  await fs.writeFile(jobsPath, JSON.stringify(jobs, null, 2));
}

async function scheduleJob(payload: SendPayload): Promise<ScheduledJob> {
  const jobs = await loadJobs();
  const job: ScheduledJob = {
    id: `job-${Math.random().toString(36).slice(2, 10)}`,
    payload,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  jobs.unshift(job);
  await saveJobs(jobs);
  return job;
}

async function processDueJobs() {
  const jobs = await loadJobs();
  let changed = false;

  for (const job of jobs) {
    if (job.status !== 'scheduled' || !job.payload.sendAt) {
      continue;
    }

    if (new Date(job.payload.sendAt).getTime() > Date.now()) {
      continue;
    }

    try {
      await sendEmail({ ...job.payload, sendAt: undefined });
      job.status = 'sent';
      job.sentAt = new Date().toISOString();
      job.error = undefined;
      changed = true;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Scheduled send failed';
      changed = true;
    }
  }

  if (changed) {
    await saveJobs(jobs);
  }
}

function looksScheduled(sendAt?: string) {
  return Boolean(sendAt && new Date(sendAt).getTime() > Date.now() + 60_000);
}

function normalizeResumeText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseResumeSections(rawText: string) {
  const normalized = normalizeResumeText(rawText);
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const education = lines.filter((line) =>
    /(university|college|school|gpa|bachelor|master|wharton|stern|ross|haas|mcintire|kelley)/i.test(line),
  );
  const achievements = lines.filter((line) => /(%|\$|m\b|b\b|led|built|modeled|advised|analyzed|valuation|lbo|merger)/i.test(line));
  const experience = lines.filter((line) => /(intern|analyst|assistant|experience|capital|finance|investment|research|private equity)/i.test(line));
  const skills = lines
    .filter((line) => /(excel|powerpoint|valuation|modeling|accounting|bloomberg|capital iq|pitchbook|python|sql)/i.test(line))
    .flatMap((line) => line.split(/,|·|\|/))
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    rawText: normalized,
    education: Array.from(new Set(education)).slice(0, 6),
    achievements: Array.from(new Set(achievements)).slice(0, 8),
    experience: Array.from(new Set(experience)).slice(0, 8),
    skills: Array.from(new Set(skills)).slice(0, 12),
  };
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/auth/google/url', (_request, response) => {
  response.json({ authUrl: getAuthUrl() });
});

app.get('/api/auth/google/callback', async (request, response) => {
  const code = String(request.query.code ?? '');
  if (!code) {
    response.status(400).send('Missing OAuth code.');
    return;
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    await saveTokens(tokens);

    const gmail = google.gmail({ version: 'v1', auth: client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress ?? 'connected Gmail account';

    response.send(`
      <!doctype html>
      <html lang="en">
        <body style="font-family:Arial,sans-serif;background:#0b1118;color:#e5e7eb;padding:32px;">
          <h2 style="margin-top:0;">BulgeBracket.ai Gmail connection complete</h2>
          <p>Authenticated as ${email}. You can close this window and return to the app.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'bulgebracket-google-auth-success', email: ${JSON.stringify(email)} }, '*');
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    response.status(500).send(error instanceof Error ? error.message : 'Google OAuth callback failed.');
  }
});

app.get('/api/gmail/status', async (_request, response) => {
  try {
    const authUrl = getAuthUrl();
    if (!googleConfigured()) {
      response.json({
        authenticated: false,
        authUrl,
        lastError: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to enable live Gmail send/schedule.',
      });
      return;
    }

    const auth = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    response.json({
      authenticated: true,
      email: profile.data.emailAddress,
      authUrl,
    });
  } catch (error) {
    response.json({
      authenticated: false,
      authUrl: getAuthUrl(),
      lastError: error instanceof Error ? error.message : 'Unable to verify Gmail status.',
    });
  }
});

app.post('/api/gmail/send', async (request, response) => {
  try {
    const payload = request.body as SendPayload;
    if (!payload.to || !payload.subject || !payload.body) {
      response.status(400).json({ error: 'to, subject, and body are required.' });
      return;
    }

    if (looksScheduled(payload.sendAt)) {
      const job = await scheduleJob(payload);
      response.json({ status: 'scheduled', jobId: job.id, sendAt: payload.sendAt });
      return;
    }

    const sent = await sendEmail({ ...payload, sendAt: undefined });
    response.json({ status: 'sent', messageId: sent.id });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to send email.' });
  }
});

app.get('/api/gmail/scheduled', async (_request, response) => {
  try {
    const jobs = await loadJobs();
    response.json({ jobs });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to load scheduled jobs.' });
  }
});

app.get('/api/gmail/messages', async (_request, response) => {
  try {
    const auth = await getAuthorizedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const [sent, inbox] = await Promise.all([
      gmail.users.messages.list({ userId: 'me', labelIds: ['SENT'], maxResults: 10 }),
      gmail.users.messages.list({ userId: 'me', labelIds: ['INBOX'], maxResults: 10 }),
    ]);
    response.json({ sent: sent.data.messages ?? [], inbox: inbox.data.messages ?? [] });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to read Gmail messages.' });
  }
});

app.post('/api/resume/parse', upload.single('resume'), async (request, response) => {
  try {
    const file = request.file;
    if (!file) {
      response.status(400).json({ error: 'Resume file is required.' });
      return;
    }

    let rawText = '';
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      rawText = parsed.text;
      await parser.destroy();
    } else {
      rawText = file.buffer.toString('utf8');
    }

    response.json(parseResumeSections(rawText));
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to parse resume.' });
  }
});

if (await fs
  .access(distPath)
  .then(() => true)
  .catch(() => false)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(distPath, 'index.html'));
  });
}

await ensureServerData();
setInterval(() => {
  void processDueJobs();
}, 30_000);
void processDueJobs();

app.listen(port, () => {
  console.log(`BulgeBracket.ai server listening on http://localhost:${port}`);
});
