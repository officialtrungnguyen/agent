import * as React from "react";
import {
  ChevronUp, ChevronDown, Send, Trash2, Zap, CalendarClock, Clock, CheckCircle2,
  AlertTriangle, Loader2, Inbox, Eye,
} from "lucide-react";
import type { QueueItem, QueueItemStatus } from "../types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Dialog, DialogHeader } from "./ui/Dialog";
import { useApp } from "../store/AppContext";
import { cn, fmtDateTime } from "../lib/utils";

const STATUS_META: Record<QueueItemStatus, { label: string; tone: "neutral" | "accent" | "green" | "amber" | "red" | "slate"; icon: React.ReactNode }> = {
  queued: { label: "Queued", tone: "neutral", icon: <Clock className="h-3 w-3" /> },
  scheduled: { label: "Scheduled", tone: "accent", icon: <CalendarClock className="h-3 w-3" /> },
  sending: { label: "Sending", tone: "amber", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  sent: { label: "Sent", tone: "green", icon: <CheckCircle2 className="h-3 w-3" /> },
  delivered: { label: "Delivered", tone: "green", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Failed", tone: "red", icon: <AlertTriangle className="h-3 w-3" /> },
};

export function QueuePanel() {
  const { queue, contacts, removeFromQueue, sendQueueItem, executePipeline, auth } = useApp();
  const [open, setOpen] = React.useState(true);
  const [review, setReview] = React.useState<QueueItem | null>(null);
  const [running, setRunning] = React.useState(false);

  const pending = queue.filter((q) => q.status === "queued" || q.status === "scheduled");
  const sent = queue.filter((q) => q.status === "sent" || q.status === "delivered");
  const failed = queue.filter((q) => q.status === "failed");

  const nameFor = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "Unknown";
  };

  const runPipeline = async () => {
    setRunning(true);
    await executePipeline();
    setRunning(false);
  };

  if (queue.length === 0) {
    return (
      <div className="border-t border-graphite-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-graphite-400">
          <Inbox className="h-4 w-4" />
          Outreach pipeline is empty — generate emails from the ledger to start queuing.
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-graphite-200 bg-white shadow-[0_-1px_0_0_rgba(0,0,0,0.02)]">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          Outreach Pipeline
        </button>
        <div className="flex items-center gap-1.5">
          {pending.length > 0 && <Badge tone="accent">{pending.length} pending</Badge>}
          {sent.length > 0 && <Badge tone="green">{sent.length} sent</Badge>}
          {failed.length > 0 && <Badge tone="red">{failed.length} failed</Badge>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={runPipeline} disabled={running || pending.length === 0}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Execute Pipeline
          </Button>
        </div>
      </div>

      {/* Conveyor */}
      {open && (
        <div className="max-h-56 overflow-y-auto border-t border-graphite-100 scrollbar-thin">
          {queue.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <div key={item.id} className="flex items-center gap-3 border-b border-graphite-100 px-4 py-2 text-sm hover:bg-graphite-50">
                <Badge tone={meta.tone} mono className="w-24 justify-center">{meta.icon}{meta.label}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-graphite-900">{nameFor(item.contactId)}</span>
                    {item.isFollowUp && <Badge tone="outline" mono>follow-up</Badge>}
                    <span className="truncate text-graphite-400">· {item.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-graphite-400">
                    <span>{item.to}</span>
                    {item.scheduledFor && item.status === "scheduled" && (
                      <span className="text-accent">→ {fmtDateTime(item.scheduledFor)}</span>
                    )}
                    {item.sentAt && <span className="text-emerald-600">sent {fmtDateTime(item.sentAt)}</span>}
                    {item.error && <span className="text-red-500">{item.error}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setReview(item)} className="rounded p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700" title="Review">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  {(item.status === "queued" || item.status === "scheduled" || item.status === "failed") && (
                    <button
                      onClick={() => sendQueueItem(item.id)}
                      disabled={!auth.connected}
                      className="rounded p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700 disabled:opacity-40"
                      title={auth.connected ? "Send now" : "Connect Gmail first"}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {item.status !== "sending" && (
                    <button onClick={() => removeFromQueue(item.id)} className="rounded p-1.5 text-graphite-400 hover:bg-red-50 hover:text-red-500" title="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      <Dialog open={!!review} onClose={() => setReview(null)} size="md">
        {review && (
          <>
            <DialogHeader
              title={`Review — ${nameFor(review.contactId)}`}
              subtitle={review.to}
              onClose={() => setReview(null)}
              right={<Badge tone={STATUS_META[review.status].tone} mono>{STATUS_META[review.status].label}</Badge>}
            />
            <div className="space-y-3 p-5">
              <div>
                <span className="micro-label">Subject</span>
                <p className="mt-1 text-sm font-medium text-graphite-900">{review.subject}</p>
              </div>
              <div>
                <span className="micro-label">Body</span>
                <pre className="mt-1 whitespace-pre-wrap rounded-md border border-graphite-200 bg-graphite-50 p-3 font-sans text-sm text-graphite-700">{review.body}</pre>
              </div>
              <div className="flex items-center gap-3 text-xs text-graphite-500">
                {review.attachResume && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Résumé attached</span>}
                {review.scheduledFor && <span>Scheduled: {fmtDateTime(review.scheduledFor)}</span>}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => { removeFromQueue(review.id); setReview(null); }}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
                {(review.status === "queued" || review.status === "scheduled" || review.status === "failed") && (
                  <Button onClick={() => { sendQueueItem(review.id); setReview(null); }} disabled={!auth.connected}>
                    <Send className="h-4 w-4" /> Send now
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

export { cn };
