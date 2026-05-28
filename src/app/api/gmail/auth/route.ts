import { NextRequest, NextResponse } from "next/server";
import {
  GMAIL_SCOPES,
  createOAuthClient,
  gmailConfigured,
} from "@/lib/gmail-server";

export const dynamic = "force-dynamic";

/**
 * Returns the Google OAuth consent URL. The client opens this in a popup
 * (with an "Open in new tab" fallback if popups are blocked).
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!gmailConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Gmail is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable real Gmail send.",
      },
      { status: 200 },
    );
  }

  const oauth = createOAuthClient(origin);
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    include_granted_scopes: true,
  });

  return NextResponse.json({ configured: true, url });
}
