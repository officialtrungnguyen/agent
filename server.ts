import cors from "cors";
import "dotenv/config";
import express from "express";
import { contactsData } from "./src/contactsData";
import { QueueItem, UserProfile } from "./src/types";
import { toBase64Url } from "./src/lib/utils";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const scheduledJobs = new Map<string, NodeJS.Timeout>();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "BulgeBracket.ai scheduler",
    scheduled: scheduledJobs.size
  });
});

app.post("/api/gmail/send", async (request, response) => {
  const { accessToken, item, profile } = request.body as {
    accessToken?: string;
    item?: QueueItem;
    profile?: UserProfile;
  };

  if (!accessToken || !item || !profile) {
    response.status(400).json({ error: "accessToken, item, and profile are required." });
    return;
  }

  try {
    const result = await send(item, profile, accessToken);
    response.json(result);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown Gmail error." });
  }
});

app.post("/api/gmail/schedule", (request, response) => {
  const { accessToken, item, profile } = request.body as {
    accessToken?: string;
    item?: QueueItem;
    profile?: UserProfile;
  };

  if (!accessToken || !item?.scheduledFor || !profile) {
    response.status(400).json({ error: "accessToken, scheduled item, and profile are required." });
    return;
  }

  const delay = new Date(item.scheduledFor).getTime() - Date.now();
  if (delay < 0) {
    response.status(400).json({ error: "scheduledFor must be in the future." });
    return;
  }

  const existing = scheduledJobs.get(item.id);
  if (existing) clearTimeout(existing);

  const timeout = setTimeout(() => {
    void send(item, profile, accessToken).finally(() => scheduledJobs.delete(item.id));
  }, delay);

  scheduledJobs.set(item.id, timeout);
  response.json({ ok: true, id: item.id, scheduledFor: item.scheduledFor });
});

async function send(item: QueueItem, profile: UserProfile, accessToken: string) {
  const contact = contactsData.find((candidate) => candidate.id === item.contactId);
  if (!contact) throw new Error(`Unknown contact ${item.contactId}`);

  const raw = toBase64Url(
    [
      `To: ${contact.email}`,
      `From: ${profile.name || "Candidate"} <${profile.email}>`,
      `Subject: ${item.draft.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      item.draft.body
    ].join("\r\n")
  );

  const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });

  if (!gmailResponse.ok) {
    throw new Error(`Gmail send failed (${gmailResponse.status}): ${await gmailResponse.text()}`);
  }

  return gmailResponse.json();
}

app.listen(port, () => {
  console.log(`BulgeBracket.ai scheduler listening on http://localhost:${port}`);
});
