import { CalendarClock, Play, Send, Trash2 } from "lucide-react";
import type { Contact, GmailAuthState, OutreachRecord, QueuedEmail } from "../types";
import { getOptimalSendTime } from "../lib/intelligence";
import { formatDateTime, uid } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
            error_callback?: (error: unknown) => void;
            prompt?: string;
          }) => { requestAccessToken: (overrides?: { prompt?: string }) => void };
        };
      };
    };
  }
}

interface GmailSchedulerProps {
  queue: QueuedEmail[];
  contactsById: Map<string, Contact>;
  auth: GmailAuthState;
  setAuth: (auth: GmailAuthState) => void;
  onQueueChange: (queue: QueuedEmail[]) => void;
  onRecord: (record: OutreachRecord) => void;
}

export function GmailScheduler({ queue, contactsById, auth, setAuth, onQueueChange, onRecord }: GmailSchedulerProps) {
  const connected = Boolean(auth.accessToken && auth.expiresAt && auth.expiresAt > Date.now());
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  function connect() {
    if (!clientId) {
      window.open("https://console.cloud.google.com/apis/credentials", "_blank", "noopener,noreferrer");
      alert("Set VITE_GOOGLE_CLIENT_ID in your environment, then restart the app. A Google Cloud credentials tab was opened for setup guidance.");
      return;
    }
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
      callback: (response) => {
        if (response.access_token) {
          setAuth({
            accessToken: response.access_token,
            expiresAt: Date.now() + (response.expires_in ?? 3300) * 1000
          });
        }
      },
      error_callback: () => {
        window.open("https://accounts.google.com/o/oauth2/v2/auth", "_blank", "noopener,noreferrer");
      }
    });
    tokenClient?.requestAccessToken({ prompt: "consent" });
  }

  async function send(email: QueuedEmail, scheduledFor?: string) {
    if (!auth.accessToken) {
      connect();
      return;
    }
    const contact = contactsById.get(email.contactId);
    const payload = {
      ...email,
      scheduledFor,
      accessToken: auth.accessToken
    };
    const endpoint = scheduledFor ? "/api/gmail/schedule" : "/api/gmail/send";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const status = scheduledFor ? "Scheduled" : "Sent";
    onRecord({
      id: uid("record"),
      contactId: email.contactId,
      subject: email.subject,
      body: email.body,
      variant: email.variant,
      status,
      sentAt: scheduledFor ? undefined : new Date().toISOString(),
      scheduledFor,
      hook: contact ? `${contact.team} / ${contact.recentDeals[0].company}` : "Generated hook",
      attachmentName: email.attachment?.fileName
    });
    onQueueChange(queue.filter((queued) => queued.id !== email.id));
  }

  async function executePipeline() {
    for (const email of queue) {
      const contact = contactsById.get(email.contactId);
      const scheduledFor = contact ? getOptimalSendTime(contact) : new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await send(email, scheduledFor);
    }
  }

  return (
    <Card className="sticky bottom-4 z-20 border-slate-300 bg-white/95 backdrop-blur">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="micro-label">Gmail Conveyor Queue</p>
            <h2 className="text-lg font-semibold text-slate-950">Real send, true scheduling, pipeline execution</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={connected ? "secondary" : "primary"} onClick={connect}>
              {connected ? "Gmail connected" : "Connect Gmail OAuth"}
            </Button>
            <Button variant="primary" disabled={!queue.length} onClick={() => void executePipeline()}>
              <Play className="h-4 w-4" /> Execute Pipeline
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!queue.length ? (
          <p className="text-sm text-slate-500">Queue is empty. Generate outreach from the composer to review and send.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 thin-scrollbar">
            {queue.map((email) => {
              const contact = contactsById.get(email.contactId);
              const optimal = contact ? getOptimalSendTime(contact) : undefined;
              return (
                <div key={email.id} className="min-w-[340px] rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-950">{contact ? `${contact.firstName} ${contact.lastName}` : email.to}</p>
                      <p className="text-xs text-slate-500">{email.subject}</p>
                    </div>
                    <Badge tone="blue">{email.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{email.body}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">AI optimal: {formatDateTime(optimal)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => void send(email)}>
                      <Send className="h-4 w-4" /> Send Now
                    </Button>
                    <Button onClick={() => void send(email, optimal)}>
                      <CalendarClock className="h-4 w-4" /> Auto-Schedule
                    </Button>
                    <Button variant="ghost" onClick={() => onQueueChange(queue.filter((queued) => queued.id !== email.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          If a popup is blocked, use Connect Gmail again or open OAuth in a new tab. Scheduled emails are persisted by the Express scheduler and sent through the Gmail REST API.
        </p>
      </CardContent>
    </Card>
  );
}
