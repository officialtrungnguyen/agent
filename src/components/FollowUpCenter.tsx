"use client";

import React, { useMemo, useState } from "react";
import { Clock, Send, ListPlus, CheckCircle2, Copy, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Contact } from "@/types";
import { Avatar, Badge, Button, EmptyState, MicroLabel } from "@/components/ui";
import { generateFollowUp } from "@/lib/ai";
import { sendGmail } from "@/lib/gmail-client";
import { daysSince, fullName, initials } from "@/lib/utils";

export function FollowUpCenter() {
  const { contacts, getState, emails, gmail, resume, queueEmail, updateEmail, updateState } = useStore();

  const flagged = useMemo(() => {
    return contacts
      .map((c) => ({ c, st: getState(c.id) }))
      .filter(({ st }) => {
        if (st.status === "no_reply") return true;
        if (st.status === "sent" && st.lastOutreachAt && !st.repliedAt) {
          const d = daysSince(st.lastOutreachAt);
          return d !== null && d >= 7;
        }
        return false;
      })
      .sort((a, b) => (a.st.lastOutreachAt ?? 0) - (b.st.lastOutreachAt ?? 0));
  }, [contacts, getState]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <Clock size={16} className="text-amber-500" />
        <span><span className="font-medium text-slate-900">{flagged.length}</span> contacts auto-flagged for follow-up (no reply after 7+ days).</span>
      </div>
      {flagged.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={28} />}
          title="No follow-ups needed right now"
          hint="When a sent email goes 7 days without a reply, it surfaces here with a ready-to-send follow-up draft."
        />
      ) : (
        <div className="space-y-3">
          {flagged.map(({ c, st }) => (
            <FollowUpRow
              key={c.id}
              contact={c}
              days={daysSince(st.lastOutreachAt)}
              step={st.followUpFlagged ? 2 : 1}
              originalSubject={emails.find((e) => e.contactId === c.id && (e.status === "sent" || e.status === "delivered"))?.subject}
              onMarkReplied={() => updateState(c.id, { status: "replied", repliedAt: Date.now(), followUpFlagged: false })}
              onQueue={(subject, body, schedule) => {
                queueEmail({ contactId: c.id, to: c.email || "", subject, body, variant: "relationship", status: schedule ? "scheduled" : "queued", followUpStep: 1, scheduledAt: schedule ? Date.now() + 60000 : undefined });
                updateState(c.id, { followUpFlagged: false });
              }}
              onSend={async (subject, body) => {
                const email = queueEmail({ contactId: c.id, to: c.email || "", subject, body, variant: "relationship", status: "sending", followUpStep: 1 });
                if (!gmail.connected) {
                  updateEmail(email.id, { status: "sent", sentAt: Date.now() });
                  updateState(c.id, { status: "sent", lastOutreachAt: Date.now(), followUpFlagged: false });
                  return true;
                }
                const res = await sendGmail({ to: c.email || "", subject, body });
                if (res.ok) {
                  updateEmail(email.id, { status: "delivered", sentAt: Date.now(), gmailMessageId: res.messageId });
                  updateState(c.id, { status: "sent", lastOutreachAt: Date.now(), followUpFlagged: false });
                  return true;
                }
                updateEmail(email.id, { status: "failed", error: res.error });
                return false;
              }}
              resumeName={resume?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FollowUpRow({
  contact,
  days,
  step,
  originalSubject,
  onMarkReplied,
  onQueue,
  onSend,
  resumeName,
}: {
  contact: Contact;
  days: number | null;
  step: number;
  originalSubject?: string;
  onMarkReplied: () => void;
  onQueue: (subject: string, body: string, schedule: boolean) => void;
  onSend: (subject: string, body: string) => Promise<boolean>;
  resumeName?: string;
}) {
  const [which, setWhich] = useState<1 | 2>(step >= 2 ? 2 : 1);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const draft = generateFollowUp(contact, resumeName ? ({ name: resumeName } as never) : null, which, originalSubject);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar initials={initials(contact)} tone={contact.priority === "tier_1" ? "graphite" : "slate"} />
          <div>
            <div className="text-sm font-medium text-slate-900">{fullName(contact)}</div>
            <div className="text-xs text-slate-500">{contact.title} · {contact.firm}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {days !== null && <Badge tone="amber">⚠️ {days}d no reply</Badge>}
          <div className="flex rounded-md border border-slate-200 p-0.5 text-xs">
            <button onClick={() => setWhich(1)} className={`rounded px-2 py-0.5 ${which === 1 ? "bg-slate-900 text-white" : "text-slate-500"}`}>7-day</button>
            <button onClick={() => setWhich(2)} className={`rounded px-2 py-0.5 ${which === 2 ? "bg-slate-900 text-white" : "text-slate-500"}`}>14-day</button>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <MicroLabel className="mb-1">{draft.subject}</MicroLabel>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{draft.body}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" disabled={sent || !contact.email} onClick={async () => { const ok = await onSend(draft.subject, draft.body); if (ok) setSent(true); }}>
          {sent ? <Check size={14} /> : <Send size={14} />} {sent ? "Sent" : "Send Follow-up"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onQueue(draft.subject, draft.body, true)}><ListPlus size={14} /> Schedule</Button>
        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(`${draft.subject}\n\n${draft.body}`); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />} Copy
        </Button>
        <Button variant="ghost" size="sm" className="text-green-700" onClick={onMarkReplied}><CheckCircle2 size={14} /> Mark replied</Button>
      </div>
    </div>
  );
}
