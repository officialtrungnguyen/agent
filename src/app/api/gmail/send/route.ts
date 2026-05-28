import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  TOKEN_COOKIE,
  buildRawMessage,
  createOAuthClient,
  gmailConfigured,
  type StoredTokens,
} from "@/lib/gmail-server";

export const dynamic = "force-dynamic";

interface SendBody {
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; mimeType: string; base64: string };
}

export async function POST(req: NextRequest) {
  if (!gmailConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Gmail not configured (missing GOOGLE_CLIENT_ID/SECRET)." },
      { status: 503 },
    );
  }

  const raw = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Not connected to Gmail." }, { status: 401 });
  }

  let body: SendBody;
  try {
    body = (await req.json()) as SendBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!body.to || !body.subject || !body.body) {
    return NextResponse.json({ ok: false, error: "Missing to/subject/body." }, { status: 400 });
  }

  try {
    const tokens = JSON.parse(raw) as StoredTokens;
    const origin = req.nextUrl.origin;
    const oauth = createOAuthClient(origin);
    oauth.setCredentials({
      access_token: tokens.access_token ?? undefined,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth });
    const from = tokens.email || "me";
    const rawMessage = buildRawMessage({
      from,
      to: body.to,
      subject: body.subject,
      body: body.body,
      attachment: body.attachment,
    });

    const sent = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawMessage },
    });

    // Persist any refreshed tokens.
    const refreshed = oauth.credentials;
    const updated: StoredTokens = {
      access_token: refreshed.access_token ?? tokens.access_token,
      refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
      expiry_date: refreshed.expiry_date ?? tokens.expiry_date,
      email: tokens.email,
    };

    const res = NextResponse.json({
      ok: true,
      messageId: sent.data.id,
      threadId: sent.data.threadId,
    });
    res.cookies.set(TOKEN_COOKIE, JSON.stringify(updated), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
