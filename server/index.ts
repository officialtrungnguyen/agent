/**
 * BulgeBracket.ai backend.
 *
 * Endpoints:
 *  - GET  /api/health                   liveness
 *  - GET  /auth/google/status           current OAuth connection state
 *  - GET  /auth/google/start            redirect or return URL for OAuth
 *  - GET  /auth/google/callback         OAuth callback handler
 *  - POST /auth/google/disconnect       revoke local tokens
 *  - POST /api/gmail/send               send an email now via Gmail API
 *  - POST /api/gmail/schedule           queue an email for delayed send
 *  - GET  /api/gmail/queue              list scheduled emails
 *  - POST /api/gmail/queue/:id/cancel   cancel a scheduled email
 *  - GET  /api/gmail/history            list send history
 *  - POST /api/ai/email                 generate a personalized outreach email
 *  - POST /api/ai/intel                 generate deep deal/desk intel
 *  - POST /api/ai/advisor               chat with the strategy advisor
 */

import express from "express";
import cors from "cors";
import { env, HAS_GOOGLE_OAUTH, HAS_OPENAI } from "./env.js";
import {
  buildOAuthClient,
  cancelScheduled,
  clearTokens,
  exchangeCode,
  generateAuthUrl,
  loadTokens,
  readHistory,
  readQueue,
  scheduleEmail,
  sendEmailNow,
  startSchedulerDispatcher,
} from "./gmail.js";
import {
  generateEmail,
  offlineDealIntel,
  strategyAdvisorReply,
  type ContactContext,
  type EmailVariant,
  type ResumeContext,
} from "./ai.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "BulgeBracket.ai",
    features: {
      gmailOAuthConfigured: HAS_GOOGLE_OAUTH,
      openAiConfigured: HAS_OPENAI,
    },
    time: new Date().toISOString(),
  });
});

app.get("/auth/google/status", (_req, res) => {
  const tokens = loadTokens();
  res.json({
    configured: HAS_GOOGLE_OAUTH,
    connected: Boolean(tokens?.access_token),
    identity: tokens
      ? {
          email: tokens.email,
          name: tokens.name,
          picture: tokens.picture,
          connectedAt: tokens.connectedAt,
        }
      : null,
  });
});

app.get("/auth/google/start", (req, res) => {
  if (!HAS_GOOGLE_OAUTH) {
    return res.status(501).json({
      error: "google_oauth_not_configured",
      message:
        "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Cursor Dashboard › Cloud Agents › Secrets to enable real Gmail send/schedule.",
    });
  }
  const state = (req.query.state as string) ?? "/";
  const url = generateAuthUrl(state);
  if (!url) return res.status(500).json({ error: "could_not_create_oauth_url" });
  if (req.query.format === "json") return res.json({ url });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const state = (req.query.state as string) || "/";
  if (!code) return res.status(400).send("Missing code");
  try {
    await exchangeCode(code);
    const back = `${env.APP_BASE_URL}${state.startsWith("/") ? state : "/"}?gmail=connected`;
    res.send(`<!doctype html><html><body style="font-family:Inter,system-ui;background:#0b0d0f;color:#f6f7f8;padding:48px;">
<h1 style="font-weight:600;letter-spacing:-0.01em;">Gmail connected.</h1>
<p style="color:#838c99;">You can close this tab and return to BulgeBracket.ai.</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'bb_gmail_connected' }, '*');
      window.close();
    } else {
      window.location.href = '${back}';
    }
  } catch (e) {
    window.location.href = '${back}';
  }
</script>
</body></html>`);
  } catch (err) {
    console.error("OAuth callback failed", err);
    res.status(500).send("OAuth exchange failed");
  }
});

app.post("/auth/google/disconnect", async (_req, res) => {
  const tokens = loadTokens();
  if (tokens?.access_token) {
    const client = buildOAuthClient();
    try {
      if (client) {
        client.setCredentials(tokens as any);
        await client.revokeCredentials();
      }
    } catch {
      // ignore — local clear still happens
    }
  }
  clearTokens();
  res.json({ ok: true });
});

app.post("/api/gmail/send", async (req, res) => {
  const { to, subject, body, attachmentName, attachmentBase64, contactId, variant } = req.body ?? {};
  if (!to || !subject || !body) return res.status(400).json({ error: "missing_fields" });
  try {
    const entry = await sendEmailNow({
      to,
      subject,
      body,
      attachmentName,
      attachmentBase64,
      contactId: contactId ?? "",
      variant: variant ?? "short",
    });
    res.json({ ok: true, entry });
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/gmail/schedule", (req, res) => {
  const { to, subject, body, attachmentName, attachmentBase64, contactId, variant, scheduledFor } = req.body ?? {};
  if (!to || !subject || !body || !scheduledFor) return res.status(400).json({ error: "missing_fields" });
  const item = scheduleEmail({
    to,
    subject,
    body,
    attachmentName,
    attachmentBase64,
    contactId: contactId ?? "",
    variant: variant ?? "short",
    scheduledFor,
  });
  res.json({ ok: true, item });
});

app.get("/api/gmail/queue", (_req, res) => {
  res.json({ queue: readQueue() });
});

app.post("/api/gmail/queue/:id/cancel", (req, res) => {
  const ok = cancelScheduled(req.params.id);
  res.json({ ok });
});

app.get("/api/gmail/history", (_req, res) => {
  res.json({ history: readHistory() });
});

app.post("/api/ai/email", async (req, res) => {
  const variant = (req.body?.variant as EmailVariant) ?? "short";
  const resume = (req.body?.resume ?? {}) as ResumeContext;
  const contact = req.body?.contact as ContactContext | undefined;
  if (!contact) return res.status(400).json({ error: "missing_contact" });
  const result = await generateEmail(variant, resume, contact);
  res.json(result);
});

app.post("/api/ai/intel", (req, res) => {
  const contact = req.body?.contact as ContactContext | undefined;
  if (!contact) return res.status(400).json({ error: "missing_contact" });
  const intel = offlineDealIntel(contact);
  res.json(intel);
});

app.post("/api/ai/advisor", async (req, res) => {
  const history = (req.body?.history ?? []) as { role: "user" | "assistant"; content: string }[];
  const resume = req.body?.resume as ResumeContext | undefined;
  const pipelineSummary = req.body?.pipelineSummary as string | undefined;
  const result = await strategyAdvisorReply(history, { resume, pipelineSummary });
  res.json(result);
});

startSchedulerDispatcher();

app.listen(env.PORT, () => {
  console.log(`BulgeBracket.ai API listening on http://localhost:${env.PORT}`);
  console.log(`  Gmail OAuth configured: ${HAS_GOOGLE_OAUTH}`);
  console.log(`  OpenAI configured:      ${HAS_OPENAI}`);
});
