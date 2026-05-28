"use client";

import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Send,
  Trash2,
  Eye,
  Zap,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { OutreachEmail } from "@/types";
import { Badge, Button, Modal, Spinner } from "@/components/ui";
import { emailStatusMeta } from "@/lib/status";
import { sendGmail } from "@/lib/gmail-client";
import { fullName, formatDateTime, nextOptimalSendTime } from "@/lib/utils";

export function QueueConveyor() {
  const {
    emails,
    contacts,
    gmail,
    resume,
    settings,
    updateEmail,
    removeEmail,
    updateState,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const pending = emails.filter((e) => e.status === "queued" || e.status === "scheduled");
  const sentRecently = emails.filter((e) => e.status === "sent" || e.status === "delivered").slice(0, 30);
  const counts = {
    queued: emails.filter((e) => e.status === "queued").length,
    scheduled: emails.filter((e) => e.status === "scheduled").length,
    sending: emails.filter((e) => e.status === "sending").length,
    sent: emails.filter((e) => e.status === "sent" || e.status === "delivered").length,
    failed: emails.filter((e) => e.status === "failed").length,
  };

  const contactFor = (id: string) => contacts.find((c) => c.id === id);

  const sendOne = async (email: OutreachEmail) => {
    updateEmail(email.id, { status: "sending" });
    if (!gmail.connected) {
      updateEmail(email.id, { status: "sent", sentAt: Date.now() });
      updateState(email.contactId, { status: "sent", lastOutreachAt: Date.now() });
      return;
    }
    const attachment =
      email.attachResume && resume?.fileDataUrl
        ? (() => {
            const [meta, b64] = resume.fileDataUrl!.split(",");
            const mimeType = /data:(.*?);base64/.exec(meta)?.[1] || "application/pdf";
            return { filename: resume.fileName || "resume.pdf", mimeType, base64: b64 || "" };
          })()
        : undefined;
    const res = await sendGmail({ to: email.to, subject: email.subject, body: email.body, attachment });
    if (res.ok) {
      updateEmail(email.id, {
        status: "delivered",
        sentAt: Date.now(),
        gmailMessageId: res.messageId,
        gmailThreadId: res.threadId,
      });
      updateState(email.contactId, { status: "sent", lastOutreachAt: Date.now() });
    } else {
      updateEmail(email.id, { status: "failed", error: res.error });
    }
  };

  const executePipeline = async () => {
    setExecuting(true);
    const toSend = emails.filter((e) => e.status === "queued").slice(0, settings.dailyCap);
    for (const e of toSend) {
      // eslint-disable-next-line no-await-in-loop
      await sendOne(e);
    }
    setExecuting(false);
    setOpen(true);
  };

  const autoScheduleAll = () => {
    for (const e of emails) {
      if (e.status === "queued") {
        const c = contactFor(e.contactId);
        const when = nextOptimalSendTime(c?.seniority ?? "associate", settings.sendWindows);
        updateEmail(e.id, { status: "scheduled", scheduledAt: when });
        updateState(e.contactId, { status: "scheduled" });
      }
    }
  };

  const total = pending.length + counts.sending;
  const reviewEmail = emails.find((e) => e.id === reviewId) || null;

  if (emails.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white md:left-60">
        {/* Bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-sm font-medium">
            {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <Zap size={15} className="text-slate-900" />
            Outreach Pipeline
            <span className="ml-1 flex items-center gap-1.5">
              {counts.queued > 0 && <Badge tone="blue">{counts.queued} queued</Badge>}
              {counts.scheduled > 0 && <Badge tone="blue"><Clock size={10} /> {counts.scheduled} scheduled</Badge>}
              {counts.sending > 0 && <Badge tone="amber"><Spinner size={9} /> {counts.sending} sending</Badge>}
              {counts.sent > 0 && <Badge tone="green"><CheckCircle2 size={10} /> {counts.sent} sent</Badge>}
              {counts.failed > 0 && <Badge tone="red"><XCircle size={10} /> {counts.failed}</Badge>}
            </span>
          </button>
          <div className="flex items-center gap-2">
            {counts.queued > 0 && (
              <Button variant="outline" size="sm" onClick={autoScheduleAll}>
                <CalendarClock size={14} /> Auto-Schedule All
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={executePipeline} disabled={executing || counts.queued === 0}>
              {executing ? <Spinner size={14} /> : <Zap size={14} />} Execute Pipeline
            </Button>
          </div>
        </div>

        {/* Expanded list */}
        {open && (
          <div className="max-h-[42vh] overflow-y-auto border-t border-slate-100 px-3 py-2 animate-fade-in">
            {total === 0 && sentRecently.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Queue is empty. Generate outreach from any contact.</div>
            )}
            <div className="space-y-1.5">
              {[...pending, ...emails.filter((e) => e.status === "sending"), ...sentRecently].map((e) => {
                const c = contactFor(e.contactId);
                const meta = emailStatusMeta[e.status];
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-800">
                        {c ? fullName(c) : e.to}
                        <span className="ml-2 font-normal text-slate-400">{e.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c ? `${c.firm} · ${c.title}` : e.to}
                        {e.scheduledAt && e.status === "scheduled" && ` · sends ${formatDateTime(e.scheduledAt)}`}
                        {e.sentAt && ` · ${formatDateTime(e.sentAt)}`}
                        {e.error && <span className="text-red-500"> · {e.error}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setReviewId(e.id)} title="Review">
                        <Eye size={14} />
                      </Button>
                      {(e.status === "queued" || e.status === "scheduled" || e.status === "failed") && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => sendOne(e)} title="Send now">
                          <Send size={14} />
                        </Button>
                      )}
                      {e.status !== "sending" && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeEmail(e.id)} title="Remove">
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal open={!!reviewEmail} onClose={() => setReviewId(null)} title="Review Outreach">
        {reviewEmail && (
          <ReviewBody
            email={reviewEmail}
            contactName={contactFor(reviewEmail.contactId) ? fullName(contactFor(reviewEmail.contactId)!) : reviewEmail.to}
            onSave={(subject, body) => updateEmail(reviewEmail.id, { subject, body })}
            onSend={async () => {
              await sendOne(reviewEmail);
              setReviewId(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function ReviewBody({
  email,
  contactName,
  onSave,
  onSend,
}: {
  email: OutreachEmail;
  contactName: string;
  onSave: (subject: string, body: string) => void;
  onSend: () => Promise<void>;
}) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [sending, setSending] = useState(false);

  return (
    <div className="space-y-3 p-5">
      <div className="text-xs text-slate-500">To <span className="font-medium text-slate-700">{contactName}</span> · {email.to}</div>
      <input
        value={subject}
        onChange={(e) => { setSubject(e.target.value); onSave(e.target.value, body); }}
        className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm font-medium focus-ring"
      />
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); onSave(subject, e.target.value); }}
        rows={11}
        className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm leading-relaxed focus-ring"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onSave(subject, body)}>Save Draft</Button>
        <Button
          variant="primary"
          onClick={async () => { setSending(true); await onSend(); setSending(false); }}
          disabled={sending}
        >
          {sending ? <Spinner size={14} /> : <Send size={14} />} Send Now
        </Button>
      </div>
    </div>
  );
}
