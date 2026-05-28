import { useEffect } from "react";
import { CalendarClock, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { Contact, GmailAuthState, ParsedResume, QueueItem, Seniority, UserProfile } from "../types";
import { isTokenFresh, requestGmailAccess, scheduleOnServer, sendGmailMessage } from "../services/gmailService";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface GmailSchedulerProps {
  contacts: Contact[];
  queue: QueueItem[];
  gmail: GmailAuthState;
  profile: UserProfile;
  resume?: ParsedResume;
  onGmailChange: (gmail: GmailAuthState) => void;
  onQueueChange: (queue: QueueItem[]) => void;
  onSent: (item: QueueItem) => void;
}

const windows: Record<Seniority, [number, number]> = {
  Analyst: [7, 9],
  Associate: [7, 9],
  VP: [8, 10],
  Director: [9, 11],
  MD: [9, 11]
};

export function GmailScheduler({
  contacts,
  queue,
  gmail,
  profile,
  resume,
  onGmailChange,
  onQueueChange,
  onSent
}: GmailSchedulerProps) {
  const pending = queue.filter((item) => item.status === "Queued" || item.status === "Scheduled");

  useEffect(() => {
    const timer = window.setInterval(() => {
      const due = queue.find(
        (item) => item.status === "Scheduled" && item.scheduledFor && new Date(item.scheduledFor).getTime() <= Date.now()
      );
      if (due) void sendItem(due);
    }, 30_000);

    return () => window.clearInterval(timer);
  });

  async function connect() {
    const next = await requestGmailAccess();
    onGmailChange(next);
  }

  async function sendItem(item: QueueItem) {
    const contact = contacts.find((candidate) => candidate.id === item.contactId);
    if (!contact) return;
    if (!isTokenFresh(gmail) || !gmail.accessToken) {
      await connect();
      return;
    }

    onQueueChange(queue.map((candidate) => (candidate.id === item.id ? { ...candidate, status: "Sending" } : candidate)));

    try {
      await sendGmailMessage(gmail.accessToken, contact.email, profile, item.draft, resume);
      const sentItem: QueueItem = { ...item, status: "Delivered", sentAt: new Date().toISOString() };
      onSent(sentItem);
      onQueueChange(queue.map((candidate) => (candidate.id === item.id ? sentItem : candidate)));
    } catch (error) {
      onQueueChange(
        queue.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, status: "Failed", error: error instanceof Error ? error.message : "Unknown Gmail error" }
            : candidate
        )
      );
    }
  }

  async function autoSchedule(item: QueueItem) {
    const contact = contacts.find((candidate) => candidate.id === item.contactId);
    if (!contact) return;
    const scheduledFor = optimalSendTime(contact.title).toISOString();
    const scheduledItem: QueueItem = { ...item, scheduledFor, status: "Scheduled" };
    const nextQueue = queue.map((candidate) => (candidate.id === item.id ? scheduledItem : candidate));
    onQueueChange(nextQueue);
    await scheduleOnServer(scheduledItem, profile, gmail.accessToken);
  }

  async function executePipeline() {
    for (const item of pending.slice(0, 12)) {
      if (item.status === "Queued") {
        await autoSchedule(item);
      }
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 rounded-2xl border border-slate-300 bg-slate-950/95 p-3 text-white backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Gmail Conveyor Queue</p>
            <p className="text-sm">
              {gmail.connected ? `Connected${gmail.email ? ` as ${gmail.email}` : ""}` : "Connect real Gmail OAuth to send"}
              {!gmail.connected && " - if a popup is blocked, open the app in a new tab and retry."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={connect}>
            {gmail.connected ? "Refresh Gmail" : "Connect Gmail"}
          </Button>
          <Button size="sm" onClick={executePipeline} disabled={!pending.length}>
            <CalendarClock className="h-4 w-4" /> Execute Pipeline
          </Button>
        </div>
      </div>

      <div className="bb-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
        {queue.length ? (
          queue.slice(-10).map((item) => {
            const contact = contacts.find((candidate) => candidate.id === item.contactId);
            return (
              <div key={item.id} className="min-w-80 rounded-xl border border-slate-700 bg-slate-900 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {contact ? `${contact.firstName} ${contact.lastName}` : "Unknown contact"}
                    </p>
                    <p className="text-xs text-slate-400">{item.draft.subject}</p>
                  </div>
                  <Badge tone={item.status === "Delivered" ? "green" : item.status === "Failed" ? "red" : "blue"}>
                    {item.status}
                  </Badge>
                </div>
                {item.scheduledFor && (
                  <p className="mt-2 text-xs text-slate-400">
                    Scheduled {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.scheduledFor))}
                  </p>
                )}
                {item.error && <p className="mt-2 text-xs text-red-300">{item.error}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void sendItem(item)} disabled={item.status === "Delivered"}>
                    <Send className="h-3.5 w-3.5" /> Send Now
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800" onClick={() => void autoSchedule(item)}>
                    <CalendarClock className="h-3.5 w-3.5" /> Auto-Schedule
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            <CheckCircle2 className="h-4 w-4" /> Queue is empty. Generate emails from selected banker profiles.
          </div>
        )}
      </div>
    </div>
  );
}

export function optimalSendTime(title: Seniority) {
  const [start, end] = windows[title];
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + 1);
  target.setHours(start + Math.floor((end - start) / 2), 15, 0, 0);

  if (now.getHours() < start - 1) {
    target.setDate(now.getDate());
    target.setHours(start, 15, 0, 0);
  }

  return target;
}
