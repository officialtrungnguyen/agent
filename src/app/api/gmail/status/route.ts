import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE, gmailConfigured, type StoredTokens } from "@/lib/gmail-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const configured = gmailConfigured();
  const raw = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ configured, connected: false });
  }
  try {
    const tokens = JSON.parse(raw) as StoredTokens;
    return NextResponse.json({
      configured,
      connected: Boolean(tokens.access_token || tokens.refresh_token),
      email: tokens.email ?? undefined,
      expiresAt: tokens.expiry_date ?? undefined,
    });
  } catch {
    return NextResponse.json({ configured, connected: false });
  }
}
