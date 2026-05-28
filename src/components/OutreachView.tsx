import { useMemo } from "react";
import type { Contact, ResumeData, UserProfile, OutreachEmail } from "../types";
import { Button } from "./ui/Button";
import { Pill } from "./ui/Pill";
import { StatusBadge } from "./StatusBadge";
import { Plus, Send, Clock, FileText } from "lucide-react";
import { generateFollowUp } from "../lib/ai/email";

interface Props {
  emails: OutreachEmail[];
  contacts: Contact[];
  resume: ResumeData | null;
  profile: UserProfile;
  onCompose: (c: Contact) => void;
  onSendFollowup: (c: Contact, original: OutreachEmail, days: 7 | 14) => void;
}

export function OutreachView({ emails, contacts, resume, profile, onCompose, onSendFollowup }: Props) {
  const grouped = useMemo(() => {
    const sent = emails.filter((e) => e.status === "sent").sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""));
    const scheduled = emails.filter((e) => e.status === "queued" || e.status === "scheduled").sort((a, b) => (a.scheduledFor || "").localeCompare(b.scheduledFor || ""));
    const drafts = emails.filter((e) => e.status === "draft");
    const failed = emails.filter((e) => e.status === "failed");
    return { sent, scheduled, drafts, failed };
  }, [emails]);

  const followupsDue = useMemo(() => {
    return contacts
      .filter((c) => c.status === "no_reply")
      .map((c) => {
        const e = emails.filter((x) => x.contactId === c.id && x.status === "sent")
          .sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""))[0];
        return e ? { c, e } : null;
      })
      .filter(Boolean) as Array<{ c: Contact; e: OutreachEmail }>;
  }, [contacts, emails]);

  return (
    <div className="space-y-5">
      <section className="panel">
        <div className="px-4 py-3 hairline-b flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2"><Clock size={14} /> Follow-ups due (7d+)</div>
            <div className="micro mt-1">// auto-detected from sent emails</div>
          </div>
          <Pill tone="amber">{followupsDue.length}</Pill>
        </div>
        <div className="divide-y divide-graphite-200">
          {followupsDue.length === 0 && <div className="p-6 text-center text-[12.5px] text-graphite-500">Nothing due. Get more emails out the door.</div>}
          {followupsDue.map(({ c, e }) => {
            const fu = generateFollowUp({ contact: c, resume, profile }, e, 7);
            return (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-[13px]">{c.firstName} {c.lastName} — {c.firm}</div>
                    <div className="text-[11.5px] text-graphite-500">{c.team} · sent {e.sentAt ? new Date(e.sentAt).toLocaleDateString() : "—"}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onSendFollowup(c, e, 7)}>Compose 7d follow-up</Button>
                    <Button size="sm" variant="ghost" onClick={() => onSendFollowup(c, e, 14)}>14d</Button>
                  </div>
                </div>
                <div className="mt-2 hairline rounded-sharp p-2.5 bg-graphite-50/60">
                  <div className="text-[12px] font-medium">{fu.subject}</div>
                  <pre className="whitespace-pre-wrap text-[12px] mt-1 text-graphite-700">{fu.body}</pre>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Block title="// SCHEDULED & QUEUED" badge={grouped.scheduled.length}>
          {grouped.scheduled.length === 0 && <Empty />}
          {grouped.scheduled.map((e) => {
            const c = contacts.find((x) => x.id === e.contactId);
            return c ? <EmailRow key={e.id} c={c} e={e} /> : null;
          })}
        </Block>
        <Block title="// SENT" badge={grouped.sent.length}>
          {grouped.sent.length === 0 && <Empty />}
          {grouped.sent.slice(0, 30).map((e) => {
            const c = contacts.find((x) => x.id === e.contactId);
            return c ? <EmailRow key={e.id} c={c} e={e} /> : null;
          })}
        </Block>
      </div>

      {grouped.failed.length > 0 && (
        <Block title="// FAILED" badge={grouped.failed.length}>
          {grouped.failed.map((e) => {
            const c = contacts.find((x) => x.id === e.contactId);
            return c ? <EmailRow key={e.id} c={c} e={e} /> : null;
          })}
        </Block>
      )}

      <div className="panel p-4 flex items-center gap-3">
        <FileText size={14} />
        <div className="text-[12.5px] text-graphite-700">Compose new outreach from the Alumni Ledger by clicking <strong>Compose</strong> on any contact.</div>
        <div className="ml-auto"><Button variant="primary" size="sm" leading={<Plus size={11} />} onClick={() => {
          // pick top fit contact not yet contacted
          const c = [...contacts].filter((x) => x.status === "not_contacted").sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))[0];
          if (c) onCompose(c);
        }}>Compose Top Fit</Button></div>
      </div>
    </div>
  );
}

function Block({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="px-4 py-2.5 hairline-b flex items-center justify-between">
        <div className="micro-strong">{title}</div>
        {typeof badge === "number" && <Pill tone="neutral">{badge}</Pill>}
      </div>
      <div className="divide-y divide-graphite-200 max-h-[60vh] overflow-y-auto scroll-thin">
        {children}
      </div>
    </div>
  );
}

function EmailRow({ c, e }: { c: Contact; e: OutreachEmail }) {
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[12.5px] font-medium">{c.firstName} {c.lastName} <span className="text-graphite-500">· {c.firm}</span></div>
          <div className="text-[11.5px] text-graphite-700">{e.subject}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill tone="neutral">{e.variant}</Pill>
          <StatusBadge contact={{ ...c, status: e.status === "sent" ? "sent" : c.status }} />
        </div>
      </div>
      <div className="mt-1 micro flex items-center gap-3">
        {e.sentAt && <span><Send size={9} className="inline mr-1" /> {new Date(e.sentAt).toLocaleString()}</span>}
        {e.scheduledFor && <span><Clock size={9} className="inline mr-1" /> {new Date(e.scheduledFor).toLocaleString()}</span>}
        {e.error && <span className="text-red-700">err: {e.error}</span>}
      </div>
    </div>
  );
}

function Empty() { return <div className="p-5 text-center text-[12.5px] text-graphite-500">Nothing here yet.</div>; }
