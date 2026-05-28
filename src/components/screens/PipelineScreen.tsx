import { useEffect, useState } from "react";
import { Clock, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/utils";

interface QueueItem {
  id: string;
  to: string;
  subject: string;
  scheduledFor: string;
  contactId: string;
  variant: string;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  status: "sent" | "scheduled" | "failed";
  simulated?: boolean;
  failureReason?: string;
}

export function PipelineScreen() {
  const drafts = useAppStore((s) => s.drafts);
  const contacts = useAppStore((s) => s.contacts);
  const setStatus = useAppStore((s) => s.setStatus);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const openComposer = useAppStore((s) => s.openComposer);
  const [serverQueue, setServerQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function refresh() {
    const q = await api.gmailQueue();
    setServerQueue((q?.queue ?? []) as QueueItem[]);
    try {
      const res = await fetch("/api/gmail/history");
      const data = await res.json();
      setHistory((data.history ?? []) as HistoryItem[]);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  const queuedLocal = drafts.filter((d) => d.status === "queued");
  const sentLocal = drafts.filter((d) => d.status === "sent");
  const noReply = contacts.filter((c) => c.status === "no_reply");

  return (
    <div className="px-6 py-6">
      <div className="mb-4">
        <p className="microlabel">Operations</p>
        <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Send Pipeline</h1>
        <p className="text-xs text-graphite-500">Live view of every email moving through the system.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Local queue (review before send)" count={queuedLocal.length}>
          {queuedLocal.length === 0 ? <Empty>Drafts you queue from the composer land here.</Empty> : (
            <ul className="space-y-2">
              {queuedLocal.map((d) => {
                const c = contacts.find((x) => x.id === d.contactId);
                if (!c) return null;
                return (
                  <li key={d.id} className="rounded-md border border-graphite-200 bg-white p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[12px] font-semibold text-graphite-900">{c.fullName} · {c.firm}</p>
                        <p className="text-[11px] text-graphite-500">{d.subject}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openComposer(c.id)}>Open</Button>
                        <Button size="sm" variant="default" onClick={async () => {
                          const res = await api.gmailSend({ to: c.email, subject: d.subject, body: d.body, contactId: c.id, variant: d.variant });
                          if (res?.ok) { updateDraft(d.id, { status: "sent", sentAt: new Date().toISOString() }); setStatus(c.id, "sent"); useAppStore.getState().updateContact(c.id, { lastOutreachAt: new Date().toISOString() }); }
                        }}><Send className="h-3 w-3" /> Send</Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Server-side scheduler" count={serverQueue.length}>
          {serverQueue.length === 0 ? <Empty>Schedule sends from the composer to populate this queue.</Empty> : (
            <ul className="space-y-2">
              {serverQueue.map((q) => (
                <li key={q.id} className="rounded-md border border-graphite-200 bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-graphite-900">{q.subject}</p>
                      <p className="text-[11px] text-graphite-500">To {q.to}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-graphite-500"><Clock className="h-3 w-3" /> Fires {new Date(q.scheduledFor).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={async () => { await api.gmailCancel(q.id); refresh(); }}>
                      <X className="h-3 w-3" /> Cancel
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Send history" count={history.length}>
          {history.length === 0 ? <Empty>Every send appears here with its Gmail thread ID.</Empty> : (
            <ul className="space-y-2">
              {history.slice(0, 20).map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-md border border-graphite-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-graphite-900">{h.subject}</p>
                    <p className="truncate text-[11px] text-graphite-500">To {h.to} · {formatRelative(h.sentAt)}</p>
                    {h.failureReason && <p className="text-[10px] text-red-700">⚠ {h.failureReason}</p>}
                  </div>
                  {h.status === "failed" ? <Badge variant="danger">Failed</Badge> : h.simulated ? <Badge variant="muted">Simulated</Badge> : <Badge variant="success">Sent</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Follow-up backlog (7d+ no reply)" count={noReply.length}>
          {noReply.length === 0 ? <Empty>Clean inbox — nothing waiting for a follow-up.</Empty> : (
            <ul className="space-y-2">
              {noReply.slice(0, 10).map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3">
                  <div>
                    <p className="text-[12px] font-medium text-graphite-900">{c.fullName} · {c.firm}</p>
                    <p className="text-[11px] text-graphite-700">Last touch {formatRelative(c.lastOutreachAt)} — draft a follow-up</p>
                  </div>
                  <Button size="sm" variant="default" onClick={() => openComposer(c.id)}>Follow up</Button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Locally sent today" count={sentLocal.length}>
          {sentLocal.length === 0 ? <Empty>Once you start sending today, sends will appear here.</Empty> : (
            <ul className="space-y-2">
              {sentLocal.slice(0, 10).map((d) => {
                const c = contacts.find((x) => x.id === d.contactId);
                if (!c) return null;
                return (
                  <li key={d.id} className="flex items-center justify-between rounded-md border border-graphite-200 bg-white p-3">
                    <div>
                      <p className="text-[12px] font-medium text-graphite-900">{c.fullName} · {c.firm}</p>
                      <p className="text-[11px] text-graphite-500">{d.subject}</p>
                    </div>
                    <Badge variant="success">Sent · {formatRelative(d.sentAt)}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="surface">
      <div className="flex items-center justify-between border-b border-graphite-100 px-4 py-2.5">
        <p className="text-[12px] font-semibold text-graphite-900">{title}</p>
        <Badge variant="muted" className="text-[10px]">{count}</Badge>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[11px] text-graphite-400">{children}</p>;
}
