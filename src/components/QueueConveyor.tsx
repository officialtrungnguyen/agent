import { useEffect, useState } from "react";
import type { Contact, OutreachEmail } from "../types";
import { Pill } from "./ui/Pill";
import { Button } from "./ui/Button";
import { Send, Clock, X, ChevronUp, ChevronDown, Rocket } from "lucide-react";
import { cn } from "../lib/cn";
import { gmailQueue, gmailSend, gmailCancel } from "../lib/gmailClient";

interface Props {
  emails: OutreachEmail[];
  contacts: Contact[];
  oauthTokens: unknown;
  gmailConnected: boolean;
  onEmailUpdate: (e: OutreachEmail) => void;
  onMarkSent: (contactId: string) => void;
  onRemove: (id: string) => void;
  onReview: (e: OutreachEmail) => void;
}

export function QueueConveyor({
  emails, contacts, oauthTokens, gmailConnected, onEmailUpdate, onMarkSent, onRemove, onReview,
}: Props) {
  const [open, setOpen] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [serverStatus, setServerStatus] = useState<Record<string, string>>({});

  const queue = emails.filter((e) => e.status === "queued" || e.status === "scheduled");

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { items } = await gmailQueue();
        const map: Record<string, string> = {};
        for (const it of items) map[it.id] = it.status;
        setServerStatus(map);
      } catch { /* offline */ }
    }, 8000);
    return () => clearInterval(id);
  }, []);

  async function executePipeline() {
    setExecuting(true);
    try {
      for (const e of queue) {
        const c = contacts.find((x) => x.id === e.contactId);
        if (!c?.email) continue;
        if (!gmailConnected || !oauthTokens) continue;
        try {
          await gmailSend({
            to: c.email,
            subject: e.subject,
            body: e.body,
            tokens: oauthTokens,
          });
          onEmailUpdate({ ...e, status: "sent", sentAt: new Date().toISOString() });
          onMarkSent(c.id);
        } catch (err) {
          onEmailUpdate({ ...e, status: "failed", error: err instanceof Error ? err.message : String(err) });
        }
      }
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 hairline-t bg-white">
      <div className="px-4 h-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="micro-strong">// OUTREACH CONVEYOR</div>
          <Pill tone="ink">{queue.length} queued</Pill>
          {!gmailConnected && <Pill tone="amber">Connect Gmail to enable real sending</Pill>}
          {executing && <Pill tone="blue">Executing…</Pill>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" leading={<Rocket size={12} />} onClick={executePipeline} disabled={!queue.length || executing || !gmailConnected}>
            Execute Pipeline
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} leading={open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}>
            {open ? "Hide" : "Show"}
          </Button>
        </div>
      </div>
      <div className={cn("transition-[max-height] overflow-hidden", open ? "max-h-[260px]" : "max-h-0")}>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scroll-thin">
          {!queue.length && (
            <div className="py-6 text-center w-full text-[12.5px] text-graphite-500">
              No queued emails. Compose one from any contact and choose "Schedule" or "Queue".
            </div>
          )}
          {queue.map((e) => {
            const c = contacts.find((x) => x.id === e.contactId);
            if (!c) return null;
            const status = serverStatus[e.id] || e.status;
            return (
              <div key={e.id} className="min-w-[280px] max-w-[320px] hairline rounded-sharp p-2.5 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-[12.5px]">{c.firstName} {c.lastName}</div>
                  <Pill tone={status === "sent" ? "green" : status === "failed" ? "red" : "blue"}>
                    {status}
                  </Pill>
                </div>
                <div className="text-[11px] text-graphite-500 mt-0.5 truncate">{c.firm} · {c.team}</div>
                <div className="text-[11px] text-graphite-700 mt-1 line-clamp-2">{e.subject}</div>
                {e.scheduledFor && (
                  <div className="micro mt-1 inline-flex items-center gap-1">
                    <Clock size={10} /> {new Date(e.scheduledFor).toLocaleString()}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onReview(e)}>Review</Button>
                  <Button
                    size="sm"
                    variant="primary"
                    leading={<Send size={10} />}
                    disabled={!gmailConnected}
                    onClick={async () => {
                      if (!c.email) return;
                      try {
                        await gmailSend({ to: c.email, subject: e.subject, body: e.body, tokens: oauthTokens });
                        onEmailUpdate({ ...e, status: "sent", sentAt: new Date().toISOString() });
                        onMarkSent(c.id);
                      } catch (err) {
                        onEmailUpdate({ ...e, status: "failed", error: err instanceof Error ? err.message : String(err) });
                      }
                    }}
                  >
                    Send Now
                  </Button>
                  <button
                    className="btn-ghost h-7 px-1.5 ml-auto"
                    title="Remove"
                    onClick={async () => {
                      onRemove(e.id);
                      void gmailCancel(e.id);
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
