import { format } from "date-fns";
import { Send, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Contact, EmailDraft, GmailSession, ResumeProfile, ScheduledQueueItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GmailQueuePanelProps {
  apiBaseUrl: string;
  queue: ScheduledQueueItem[];
  draftsById: Record<string, EmailDraft>;
  contactsById: Record<string, Contact>;
  resumeProfile: ResumeProfile | null;
  gmailSession: GmailSession | null;
  onGmailSessionChange: (session: GmailSession | null) => void;
  onQueueChange: (items: ScheduledQueueItem[]) => void;
  onContactUpdateAfterSend: (contactId: string, status: Contact["status"]) => void;
}

type QueueAction = "send-now" | "auto-schedule";

function recommendedSendAt(contact: Contact): string {
  const now = new Date();
  const sendAt = new Date(now);
  sendAt.setDate(now.getDate() + (now.getHours() >= 11 ? 1 : 0));

  const title = contact.title.toLowerCase();
  if (title.includes("analyst")) sendAt.setHours(8, 0, 0, 0);
  else if (title.includes("vice president")) sendAt.setHours(9, 0, 0, 0);
  else if (title.includes("managing director")) sendAt.setHours(10, 0, 0, 0);
  else sendAt.setHours(8, 30, 0, 0);

  return sendAt.toISOString();
}

export function GmailQueuePanel({
  apiBaseUrl,
  queue,
  draftsById,
  contactsById,
  resumeProfile,
  gmailSession,
  onGmailSessionChange,
  onQueueChange,
  onContactUpdateAfterSend,
}: GmailQueuePanelProps) {
  const [authBlocked, setAuthBlocked] = useState(false);
  const [manualAuthUrl, setManualAuthUrl] = useState("");
  const [inFlightQueueId, setInFlightQueueId] = useState<string | null>(null);
  const [remoteJobs, setRemoteJobs] = useState<Array<{ id: string; sendAt: string; status: string }>>([]);

  useEffect(() => {
    function handleAuthMessage(event: MessageEvent) {
      const payload = event.data as { type?: string; sessionId?: string; email?: string };
      if (payload?.type !== "bb-google-auth-success" || !payload.sessionId || !payload.email) return;
      onGmailSessionChange({
        sessionId: payload.sessionId,
        email: payload.email,
      });
      setAuthBlocked(false);
    }

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [onGmailSessionChange]);

  useEffect(() => {
    if (!gmailSession) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/gmail/jobs?sessionId=${gmailSession.sessionId}`);
        if (!response.ok) return;
        const payload = (await response.json()) as Array<{ id: string; sendAt: string; status: string }>;
        setRemoteJobs(payload);
      } catch {
        // Queue panel never hard-fails if remote jobs cannot be loaded.
      }
    }, 7000);
    return () => window.clearInterval(interval);
  }, [apiBaseUrl, gmailSession]);

  const queueWithDraft = useMemo(
    () =>
      queue.map((item) => ({
        ...item,
        draft: draftsById[item.draftId],
        contact: contactsById[item.contactId],
      })),
    [contactsById, draftsById, queue],
  );

  function connectGoogle() {
    const authUrl = `${apiBaseUrl}/api/auth/google/start?origin=${encodeURIComponent(window.location.origin)}`;
    setManualAuthUrl(authUrl);
    const popup = window.open(authUrl, "bb-google-auth", "width=520,height=740");
    if (!popup) {
      setAuthBlocked(true);
    }
  }

  async function processQueueItem(item: ScheduledQueueItem, action: QueueAction) {
    if (!gmailSession) return;
    const draft = draftsById[item.draftId];
    const contact = contactsById[item.contactId];
    if (!draft || !contact) return;

    setInFlightQueueId(item.id);
    try {
      const attachments =
        draft.includeTailoredResume && resumeProfile?.uploadedBase64
          ? [
              {
                filename: resumeProfile.uploadedFileName ?? "resume.pdf",
                mimeType: resumeProfile.uploadedMimeType ?? "application/pdf",
                base64Data: resumeProfile.uploadedBase64,
              },
            ]
          : [];

      if (action === "send-now") {
        const response = await fetch(`${apiBaseUrl}/api/gmail/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: gmailSession.sessionId,
            to: draft.to,
            subject: draft.chosenSubject,
            body: draft.body,
            attachments,
            metadata: {
              contactId: item.contactId,
            },
          }),
        });

        if (!response.ok) throw new Error("send failed");
        const payload = (await response.json()) as { id: string };
        onQueueChange(
          queue.map((existing) =>
            existing.id === item.id
              ? { ...existing, status: "sent", providerId: payload.id, providerStatus: "sent" }
              : existing,
          ),
        );
        onContactUpdateAfterSend(item.contactId, "sent");
      } else {
        const sendAt = recommendedSendAt(contact);
        const response = await fetch(`${apiBaseUrl}/api/gmail/schedule`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: gmailSession.sessionId,
            sendAt,
            message: {
              to: draft.to,
              subject: draft.chosenSubject,
              body: draft.body,
              attachments,
            },
            metadata: {
              contactId: item.contactId,
              draftId: item.draftId,
            },
          }),
        });
        if (!response.ok) throw new Error("schedule failed");
        const payload = (await response.json()) as { id: string; sendAt: string };

        onQueueChange(
          queue.map((existing) =>
            existing.id === item.id
              ? {
                  ...existing,
                  status: "scheduled",
                  sendAt: payload.sendAt,
                  providerId: payload.id,
                  providerStatus: "scheduled",
                }
              : existing,
          ),
        );
        onContactUpdateAfterSend(item.contactId, "scheduled");
      }
    } catch (error) {
      onQueueChange(
        queue.map((existing) =>
          existing.id === item.id
            ? {
                ...existing,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown send failure",
              }
            : existing,
        ),
      );
    } finally {
      setInFlightQueueId(null);
    }
  }

  async function executePipeline() {
    for (const item of queueWithDraft.filter((entry) => entry.status === "queued")) {
      await processQueueItem(item, "auto-schedule");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Gmail Conveyor Queue</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            {gmailSession ? `Connected: ${gmailSession.email}` : "Not connected to Google yet"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={connectGoogle}>
            Connect Gmail OAuth
          </Button>
          <Button variant="accent" onClick={executePipeline} disabled={!gmailSession}>
            Execute Pipeline
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {authBlocked && (
          <div className="rounded-md border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-200">
            Popup blocked. Use{" "}
            <a className="underline" href={manualAuthUrl} target="_blank" rel="noreferrer">
              Open in new tab
            </a>{" "}
            to complete Google OAuth.
          </div>
        )}

        <div className="space-y-2">
          {queueWithDraft.length === 0 && <p className="text-sm text-slate-500">Queue is empty. Add drafts from composer.</p>}
          {queueWithDraft.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-800 p-3">
              <p className="text-sm text-slate-100">
                {item.contact?.firstName} {item.contact?.lastName} · {item.draft?.chosenSubject}
              </p>
              <p className="text-xs text-slate-500">
                Status: {item.status.toUpperCase()}
                {item.sendAt && ` · Send at ${format(new Date(item.sendAt), "MMM d h:mm a")}`}
              </p>
              {item.error && <p className="text-xs text-red-400">Error: {item.error}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!gmailSession || inFlightQueueId === item.id || item.status !== "queued"}
                  onClick={() => void processQueueItem(item, "send-now")}
                >
                  <Send className="h-3 w-3" />
                  Send Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!gmailSession || inFlightQueueId === item.id || item.status !== "queued"}
                  onClick={() => void processQueueItem(item, "auto-schedule")}
                >
                  <Timer className="h-3 w-3" />
                  Auto-Schedule
                </Button>
              </div>
            </div>
          ))}
        </div>

        {remoteJobs.length > 0 && (
          <div className="rounded-md border border-slate-800 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">Live Remote Schedule Jobs</p>
            <ul className="space-y-1 text-xs text-slate-300">
              {remoteJobs.slice(0, 8).map((job) => (
                <li key={job.id}>
                  {job.id} · {job.status} · {format(new Date(job.sendAt), "MMM d h:mm a")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
