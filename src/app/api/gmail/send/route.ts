import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken, to, subject, emailBody, replyToThreadId } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "No access token provided" }, { status: 401 });
    }

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "",
      emailBody,
    ];

    if (replyToThreadId) {
      messageParts.splice(2, 0, `In-Reply-To: ${replyToThreadId}`);
    }

    const rawMessage = messageParts.join("\r\n");
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        ...(replyToThreadId ? { threadId: replyToThreadId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; code?: number };
    console.error("Gmail send error:", err.message);

    if (err.code === 401 || err.status === 401) {
      return NextResponse.json(
        { error: "Gmail authentication expired. Please reconnect." },
        { status: 401 }
      );
    }

    if (err.code === 429 || err.status === 429) {
      return NextResponse.json(
        { error: "Gmail rate limit exceeded. Please wait and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
