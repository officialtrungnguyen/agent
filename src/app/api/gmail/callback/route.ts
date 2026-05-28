import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  TOKEN_COOKIE,
  createOAuthClient,
  type StoredTokens,
} from "@/lib/gmail-server";

export const dynamic = "force-dynamic";

function popupResponse(payload: Record<string, unknown>, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>BulgeBracket.ai</title>
<style>body{font-family:ui-sans-serif,system-ui;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.box{text-align:center}.t{font-size:14px;font-weight:600}.s{font-size:12px;color:#64748b;margin-top:6px}</style></head>
<body><div class="box"><div class="t">${payload.ok ? "Gmail connected" : "Connection failed"}</div>
<div class="s">You can close this window.</div></div>
<script>
  try { window.opener && window.opener.postMessage(${JSON.stringify({ source: "bb-gmail", ...payload })}, "*"); } catch (e) {}
  setTimeout(function(){ window.close(); }, 800);
</script></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return popupResponse({ ok: false, error: error || "missing_code" }, 400);
  }

  try {
    const oauth = createOAuthClient(origin);
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);

    // fetch the connected email address
    let email: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth });
      const me = await oauth2.userinfo.get();
      email = me.data.email ?? null;
    } catch {
      /* non-fatal */
    }

    const stored: StoredTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email,
    };

    const res = popupResponse({ ok: true, email });
    res.cookies.set(TOKEN_COOKIE, JSON.stringify(stored), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    return popupResponse(
      { ok: false, error: e instanceof Error ? e.message : "token_exchange_failed" },
      500,
    );
  }
}
