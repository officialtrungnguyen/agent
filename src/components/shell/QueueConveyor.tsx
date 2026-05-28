import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Play, Send, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/utils";

export function QueueConveyor() {
  const drafts = useAppStore((s) => s.drafts);
  const contacts = useAppStore((s) => s.contacts);
  const openComposer = useAppStore((s) => s.openComposer);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const setStatus = useAppStore((s) => s.setStatus);
  const removeDraft = useAppStore((s) => s.removeDraft);
  const gmail = useAppStore((s) => s.gmail);
  const [open, setOpen] = useState(true);

  const queued = useMemo(() => drafts.filter((d) => d.status === "queued"), [drafts]);
  const scheduled = useMemo(() => drafts.filter((d) => d.status === "scheduled"), [drafts]);
  const recent = useMemo(() => drafts.filter((d) => d.status === "sent").slice(0, 6), [drafts]);

  const contactOf = (id: string) => contacts.find((c) => c.id === id);

  async function executePipeline() {
    for (const d of queued) {
      const c = contactOf(d.contactId);
      if (!c) continue;
      const res = await api.gmailSend({
        to: c.email,
        subject: d.subject,
        body: d.body,
        contactId: c.id,
        variant: d.variant,
      });
      if (res?.ok) {
        updateDraft(d.id, { status: "sent", sentAt: new Date().toISOString() });
        setStatus(c.id, "sent");
        useAppStore.getState().updateContact(c.id, { lastOutreachAt: new Date().toISOString() });
      } else {
        updateDraft(d.id, { status: "failed", failureReason: res?.error ?? "unknown" });
      }
    }
  }

  if (drafts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-5xl rounded-lg border border-graphite-200 bg-white shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.18)]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between border-b border-graphite-100 px-4 py-2"
        >
          <div className="flex items-center gap-3 text-left">
            <Zap className="h-3.5 w-3.5 text-graphite-700" />
            <span className="text-[12px] font-semibold text-graphite-900">Send pipeline</span>
            <Badge variant="muted" className="text-[10px]">Queued {queued.length}</Badge>
            <Badge variant="info" className="text-[10px]">Scheduled {scheduled.length}</Badge>
            <Badge variant="success" className="text-[10px]">Sent today {recent.length}</Badge>
            {!gmail.configured && (
              <Badge variant="warn" className="text-[10px]">Simulation mode</Badge>
            )}
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-graphite-500" /> : <ChevronUp className="h-4 w-4 text-graphite-500" />}
        </button>
        {open && (
          <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-3">
            <Column title="Queued" empty="Nothing queued.">
              {queued.map((d) => {
                const c = contactOf(d.contactId);
                if (!c) return null;
                return (
                  <Row
                    key={d.id}
                    title={`${c.fullName} · ${c.firm}`}
                    subtitle={d.subject}
                    right={
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openComposer(c.id)}>Open</Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={async () => {
                            const res = await api.gmailSend({ to: c.email, subject: d.subject, body: d.body, contactId: c.id, variant: d.variant });
                            if (res?.ok) {
                              updateDraft(d.id, { status: "sent", sentAt: new Date().toISOString() });
                              setStatus(c.id, "sent");
                              useAppStore.getState().updateContact(c.id, { lastOutreachAt: new Date().toISOString() });
                            }
                          }}
                        >
                          <Send className="h-3 w-3" /> Send
                        </Button>
                        <button onClick={() => removeDraft(d.id)} className="text-graphite-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    }
                  />
                );
              })}
              {queued.length > 0 && (
                <Button size="sm" variant="default" className="mt-1 w-full" onClick={executePipeline}>
                  <Play className="h-3.5 w-3.5" /> Execute pipeline · {queued.length}
                </Button>
              )}
            </Column>

            <Column title="Scheduled" empty="No scheduled sends.">
              {scheduled.map((d) => {
                const c = contactOf(d.contactId);
                if (!c) return null;
                return (
                  <Row
                    key={d.id}
                    title={`${c.fullName} · ${c.firm}`}
                    subtitle={`${d.subject} — ${new Date(d.scheduledFor!).toLocaleString()}`}
                    right={
                      <div className="flex items-center gap-1">
                        <Badge variant="info" className="text-[10px]"><Clock className="h-3 w-3" /> Scheduled</Badge>
                        <Button size="sm" variant="ghost" onClick={() => openComposer(c.id)}>Open</Button>
                      </div>
                    }
                  />
                );
              })}
            </Column>

            <Column title="Recently sent" empty="Nothing sent yet.">
              {recent.map((d) => {
                const c = contactOf(d.contactId);
                if (!c) return null;
                return (
                  <Row
                    key={d.id}
                    title={`${c.fullName} · ${c.firm}`}
                    subtitle={`${d.subject} · ${formatRelative(d.sentAt)}`}
                    right={<Badge variant="success" className="text-[10px]">Sent</Badge>}
                  />
                );
              })}
            </Column>
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ title, children, empty }: { title: string; children: React.ReactNode; empty: string }) {
  const hasContent = Array.isArray(children) ? children.some(Boolean) : !!children;
  return (
    <div className="rounded-md border border-graphite-200 bg-graphite-50 p-2">
      <p className="microlabel mb-1.5 px-1">{title}</p>
      <div className="space-y-1.5">
        {hasContent ? children : <p className="px-1 text-[11px] text-graphite-400">{empty}</p>}
      </div>
    </div>
  );
}

function Row({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-graphite-200 bg-white px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-medium text-graphite-900">{title}</p>
        <p className="truncate text-[10.5px] text-graphite-500">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}
