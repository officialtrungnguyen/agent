import { Play, RefreshCcw, SendHorizontal, Trash2 } from "lucide-react";
import { QueueItem } from "../types";
import { Badge, Button, Card, SectionHeading } from "./ui";

interface SchedulerQueueProps {
  queue: QueueItem[];
  onExecutePipeline: () => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
  onSendNow: (item: QueueItem) => Promise<void> | void;
  onRemove: (id: string) => void;
}

const toneMap: Record<QueueItem["status"], "default" | "success" | "warning" | "danger" | "muted"> = {
  Queued: "default",
  Scheduled: "muted",
  Sent: "success",
  Delivered: "success",
  Failed: "danger",
};

export const SchedulerQueue = ({
  queue,
  onExecutePipeline,
  onRefresh,
  onSendNow,
  onRemove,
}: SchedulerQueueProps) => (
  <Card className="overflow-hidden">
    <SectionHeading
      eyebrow="Full Gmail Integration + Intelligent Scheduler"
      title="Queue conveyor"
      description="Review every draft before launch, send immediately, or execute the full batch pipeline through the live Gmail scheduler."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={onExecutePipeline}>
            <Play className="h-4 w-4" />
            Execute pipeline
          </Button>
        </div>
      }
    />

    <div className="grid gap-3 p-5">
      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-sm text-slate-500">
          Queue is empty. Generate emails above and add them to the conveyor to build a clean outreach wave.
        </div>
      ) : (
        queue.map((item) => (
          <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 xl:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-slate-100">{item.contactName}</div>
                <Badge tone={toneMap[item.status]}>{item.status}</Badge>
                <Badge tone="muted">{item.variant}</Badge>
                {item.attachmentName ? <Badge tone="muted">{item.attachmentName}</Badge> : null}
              </div>
              <div className="text-sm text-slate-300">{item.subject}</div>
              <div className="text-xs text-slate-500">Scheduled for {new Date(item.scheduledFor).toLocaleString()}</div>
              <div className="line-clamp-2 text-sm text-slate-400">{item.body}</div>
              {item.error ? <div className="text-sm text-rose-300">{item.error}</div> : null}
            </div>
            <div className="flex flex-wrap gap-2 xl:flex-col">
              <Button variant="secondary" size="sm" onClick={() => onSendNow(item)}>
                <SendHorizontal className="h-4 w-4" />
                Send now
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);
