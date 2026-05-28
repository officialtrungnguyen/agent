import { useState } from "react";
import { Send, Clock, Play, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import type { Contact, QueueItem } from "@/types";
import { CONTACTS } from "@/data/contactsData";
import { loadQueue, saveQueue, loadSettings } from "@/lib/storage";
import { getOptimalSendTime, formatScheduledTime } from "@/lib/scheduler";
import { sendEmail, executePipeline } from "@/lib/gmailClient";

interface Props {
  onUpdate: () => void;
}

export function GmailQueue({ onUpdate }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>(() => loadQueue());
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const settings = loadSettings();

  const persist = (q: QueueItem[]) => {
    setQueue(q);
    saveQueue(q);
    onUpdate();
  };

  const contactFor = (id: string): Contact | undefined =>
    CONTACTS.find((c) => c.id === id);

  const sendNow = async (item: QueueItem) => {
    const contact = contactFor(item.contactId);
    if (!contact?.email) return;
    setBusy(true);
    try {
      const res = await sendEmail({
        to: contact.email,
        subject: item.subject,
        body: item.body,
        attachResumeText: item.tailoredResume,
      });
      persist(
        queue.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: res.success ? "sent" : "failed",
                sentAt: new Date().toISOString(),
              }
            : q
        )
      );
    } finally {
      setBusy(false);
      setReviewId(null);
    }
  };

  const autoSchedule = (item: QueueItem) => {
    const contact = contactFor(item.contactId);
    const tz = settings.timezone;
    const when = getOptimalSendTime(contact?.title ?? "Analyst", tz);
    persist(
      queue.map((q) =>
        q.id === item.id
          ? {
              ...q,
              status: "scheduled",
              scheduledFor: when.toISOString(),
            }
          : q
      )
    );
  };

  const executeAll = async () => {
    setBusy(true);
    const items = queue.filter((q) => q.status === "queued" || q.status === "scheduled");
    const payload = items
      .map((item) => {
        const c = contactFor(item.contactId);
        if (!c?.email) return null;
        return {
          to: c.email,
          subject: item.subject,
          body: item.body,
          scheduledFor: item.scheduledFor,
          attachResumeText: item.tailoredResume,
        };
      })
      .filter(Boolean) as {
      to: string;
      subject: string;
      body: string;
      scheduledFor?: string;
      attachResumeText?: string;
    }[];

    try {
      const { results } = await executePipeline(payload);
      const updated = [...queue];
      let idx = 0;
      for (const item of items) {
        const r = results[idx];
        const qIdx = updated.findIndex((u) => u.id === item.id);
        if (qIdx >= 0 && r) {
          updated[qIdx] = {
            ...updated[qIdx]!,
            status: r.success ? "sent" : "failed",
            sentAt: new Date().toISOString(),
          };
        }
        idx++;
      }
      persist(updated);
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    persist(queue.filter((q) => q.id !== id));
    setReviewId(null);
  };

  const review = queue.find((q) => q.id === reviewId);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-graphite-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 font-mono text-[10px] uppercase text-graphite-500">
              Pipeline Queue ({queue.length})
            </span>
            {queue.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setReviewId(item.id)}
                className="shrink-0 rounded border border-graphite-200 px-2 py-1 text-xs hover:bg-graphite-50"
              >
                {item.contactName}{" "}
                <Badge variant={item.status === "sent" ? "replied" : "queued"}>
                  {item.status}
                </Badge>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" disabled={busy || !queue.length} onClick={executeAll}>
              <Play className="h-4 w-4" />
              Execute Pipeline
            </Button>
          </div>
        </div>
      </div>

      {review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/40 p-4">
          <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{review.contactName}</h3>
                <Button variant="ghost" size="icon" onClick={() => setReviewId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm font-medium">{review.subject}</p>
              <pre className="whitespace-pre-wrap rounded border border-graphite-100 bg-graphite-50 p-3 text-xs">
                {review.body}
              </pre>
              {review.scheduledFor && (
                <p className="text-xs text-graphite-500">
                  Scheduled:{" "}
                  {formatScheduledTime(review.scheduledFor, settings.timezone)}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={() => void sendNow(review)}>
                  <Send className="h-4 w-4" />
                  Send Now
                </Button>
                <Button size="sm" variant="outline" onClick={() => autoSchedule(review)}>
                  <Clock className="h-4 w-4" />
                  Auto-Schedule
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(review.id)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
