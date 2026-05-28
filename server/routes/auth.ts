import { Router } from "express";
import { google } from "googleapis";

export const authRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || "http://localhost:5173";
const REDIRECT_PATH = "/auth/google/callback";
const API_PORT = Number(process.env.PORT || 8787);
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${API_PORT}${REDIRECT_PATH}`;

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.readonly",
];

function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

authRouter.get("/google/config", (_req, res) => {
  res.json({
    configured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    clientIdPrefix: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.slice(0, 12) + "…" : null,
    redirectUri: REDIRECT_URI,
    scopes: SCOPES,
  });
});

authRouter.get("/google/start", (_req, res) => {
  const client = getOAuth2Client();
  if (!client) {
    return res.status(503).send(
      htmlPage(
        "Gmail OAuth not configured",
        `<p>Set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in your environment, then restart the API server.</p>
         <p>Authorized redirect URI for your OAuth client must be exactly:</p>
         <pre>${escapeHtml(REDIRECT_URI)}</pre>`
      )
    );
  }
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
  });
  res.redirect(url);
});

authRouter.get("/google/callback", async (req, res) => {
  const client = getOAuth2Client();
  if (!client) {
    return res.status(503).send(htmlPage("OAuth not configured", "Configure env vars and retry."));
  }
  const code = String(req.query.code || "");
  if (!code) {
    return res.status(400).send(htmlPage("Missing code", "Authorization code missing in callback."));
  }
  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const profile = await oauth2.userinfo.get();
    const payload = {
      tokens,
      profile: {
        email: profile.data.email,
        name: profile.data.name,
        picture: profile.data.picture,
      },
      receivedAt: Date.now(),
    };
    const json = JSON.stringify(payload).replace(/</g, "\\u003c");
    res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"/><title>Gmail connected</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;background:#f7f8f9;color:#13171c;display:grid;place-items:center;height:100vh;margin:0}
  .card{background:#fff;border:1px solid #dfe2e6;padding:28px 32px;max-width:420px;text-align:center;border-radius:2px}
  .ok{font-family:JetBrains Mono,monospace;letter-spacing:.14em;text-transform:uppercase;font-size:10px;color:#15803d}
  h1{font-weight:600;margin:8px 0 4px;font-size:18px}
  p{color:#4a525d;font-size:13px;margin:6px 0}
  code{background:#eef0f2;padding:2px 5px;border-radius:2px;font-size:12px}
</style></head>
<body>
  <div class="card">
    <div class="ok">// gmail authorized</div>
    <h1>You're connected.</h1>
    <p>You can close this tab and return to BulgeBracket.ai.</p>
    <p><code>${escapeHtml(String(profile.data.email || ""))}</code></p>
  </div>
<script>
(function(){
  try{
    var payload = ${json};
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({source:"bulgebracket-oauth", payload: payload}, "${PUBLIC_ORIGIN}");
      window.opener.postMessage({source:"bulgebracket-oauth", payload: payload}, "*");
      setTimeout(function(){ window.close(); }, 600);
    } else {
      localStorage.setItem("bb_oauth_payload", JSON.stringify(payload));
      document.title = "Connected — return to BulgeBracket.ai";
    }
  } catch(e){
    console.error(e);
  }
})();
</script>
</body></html>`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).send(htmlPage("OAuth failure", `<pre>${escapeHtml(msg)}</pre>`));
  }
});

authRouter.post("/google/refresh", async (req, res) => {
  const client = getOAuth2Client();
  if (!client) return res.status(503).json({ error: "oauth_not_configured" });
  const refresh_token = String(req.body?.refresh_token || "");
  if (!refresh_token) return res.status(400).json({ error: "missing_refresh_token" });
  try {
    client.setCredentials({ refresh_token });
    const { credentials } = await client.refreshAccessToken();
    res.json({ tokens: credentials });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "refresh_failed", message: msg });
  }
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}

function htmlPage(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
  <style>body{font-family:Inter,system-ui,sans-serif;background:#f7f8f9;color:#13171c;padding:32px;max-width:640px;margin:0 auto}
  pre{background:#0a0d11;color:#f7f8f9;padding:16px;border-radius:2px;overflow:auto;font-size:12px}
  code{background:#eef0f2;padding:2px 5px;border-radius:2px;font-size:12px}
  h1{font-weight:600}</style></head>
  <body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}
