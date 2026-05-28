"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Send,
  CalendarClock,
  ListPlus,
  Paperclip,
  RefreshCw,
  Check,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { EmailVariant } from "@/types";
import { Avatar, Badge, Button, MicroLabel, Modal, Spinner } from "@/components/ui";
import { generateEmail, generateSubjects, wordCount } from "@/lib/ai";
import { sendGmail } from "@/lib/gmail-client";
import {
  fullName,
  initials,
  nextOptimalSendTime,
  formatDateTime,
  seniorityLabel,
} from "@/lib/utils";

const VARIANTS: { key: EmailVariant; label: string; hint: string }[] = [
  { key: "short", label: "Short", hint: "Crisp & low-friction" },
  { key: "relationship", label: "Relationship-First", hint: "Warm, alumni-led" },
  { key: "deal_referenced", label: "Deal-Referenced", hint: "Cites recent transaction" },
  { key: "aggressive", label: "Aggressive", hint: "High-conviction closer" },
];

export function OutreachComposer() {
  const {
    contacts,
    composerContactId,
    openComposer,
    resume,
    settings,
    gmail,
    queueEmail,
    updateEmail,
    updateState,
  } = useStore();

  const contact = contacts.find((c) => c.id === composerContactId) || null;

  const [variant, setVariant] = useState<EmailVariant>("short");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attach, setAttach] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [busy, setBusy] = useState<null | "send" | "schedule" | "queue">(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjects = useMemo(() => (contact ? generateSubjects(contact, resume) : []), [contact, resume]);

  const regenerate = useMemo(
    () => (v: EmailVariant) => {
      if (!contact) return;
      const g = generateEmail(contact, resume, v);
      setSubject(g.subject);
      setBody(g.body);
    },
    [contact, resume],
  );

  // initialize when opened or variant changes
  useEffect(() => {
    if (contact) {
      const g = generateEmail(contact, resume, variant);
      setSubject(g.subject);
      setBody(g.body);
      setDone(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerContactId, variant]);

  if (!contact) return null;

  const wc = wordCount(body);
  const overLimit = wc > 150;
  const canSend = gmail.connected;
  const optimal = nextOptimalSendTime(contact.seniority, settings.sendWindows);

  const enrichWithAI = async () => {
    setEnriching(true);
    try {
      const deal = contact.recentDeals[0];
      const prompt = `Rewrite this cold investment-banking networking email to be more compelling while staying under 150 words, professional, and low-pressure with a single 15-minute coffee-chat ask. Keep the greeting and signature. Context: recipient ${fullName(contact)}, ${contact.title} at ${contact.firm}, ${contact.team}, covers ${contact.coverage.join(", ")}.${deal ? ` Recent deal: ${deal.type} on ${deal.company} (${deal.value}).` : ""}${resume?.name ? ` Sender: ${resume.name}, ${resume.school}, targeting ${resume.targetRole}.` : ""}\n\nEMAIL:\n${body}`;
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await r.json();
      if (data.ok && data.text) {
        setBody(String(data.text).trim());
        setDone("AI-enriched ✓");
      } else {
        setDone("Using premium offline draft");
      }
    } catch {
      setDone("Using premium offline draft");
    } finally {
      setEnriching(false);
      setTimeout(() => setDone(null), 2000);
    }
  };

  const to = contact.email || "";

  const doQueue = (mode: "queue" | "schedule") => {
    const scheduledAt = mode === "schedule" ? optimal : undefined;
    const email = queueEmail({
      contactId: contact.id,
      to,
      subject,
      body,
      variant,
      status: mode === "schedule" ? "scheduled" : "queued",
      scheduledAt,
      attachResume: attach,
    });
    updateState(contact.id, {
      status: mode === "schedule" ? "scheduled" : "queued",
    });
    setDone(mode === "schedule" ? `Scheduled for ${formatDateTime(scheduledAt)}` : "Added to pipeline queue");
    setBusy(null);
    void email;
    setTimeout(() => openComposer(null), 900);
  };

  const doSendNow = async () => {
    setBusy("send");
    setError(null);
    const email = queueEmail({
      contactId: contact.id,
      to,
      subject,
      body,
      variant,
      status: "sending",
      attachResume: attach,
    });

    if (!gmail.connected) {
      // Offline mode: record as sent locally.
      updateEmail(email.id, { status: "sent", sentAt: Date.now() });
      updateState(contact.id, { status: "sent", lastOutreachAt: Date.now() });
      setDone("Saved & marked sent (connect Gmail to deliver for real)");
      setBusy(null);
      setTimeout(() => openComposer(null), 1000);
      return;
    }

    const attachment =
      attach && resume?.fileDataUrl
        ? (() => {
            const [meta, b64] = resume.fileDataUrl!.split(",");
            const mimeType = /data:(.*?);base64/.exec(meta)?.[1] || "application/pdf";
            return { filename: resume.fileName || "resume.pdf", mimeType, base64: b64 || "" };
          })()
        : undefined;

    const res = await sendGmail({ to, subject, body, attachment });
    if (res.ok) {
      updateEmail(email.id, {
        status: "delivered",
        sentAt: Date.now(),
        gmailMessageId: res.messageId,
        gmailThreadId: res.threadId,
      });
      updateState(contact.id, { status: "sent", lastOutreachAt: Date.now() });
      setDone("Sent via Gmail ✓");
      setTimeout(() => openComposer(null), 1000);
    } else {
      updateEmail(email.id, { status: "failed", error: res.error });
      setError(res.error || "Send failed.");
    }
    setBusy(null);
  };

  return (
    <Modal
      open={!!contact}
      onClose={() => openComposer(null)}
      wide
      title={
        <div className="flex items-center gap-2">
          <Sparkles size={15} /> Hyper-Personalized Outreach
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Left: context + variants */}
        <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <Avatar initials={initials(contact)} tone={contact.priority === "tier_1" ? "graphite" : "slate"} size={44} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{fullName(contact)}</div>
              <div className="truncate text-xs text-slate-500">{seniorityLabel[contact.seniority]} · {contact.firm}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <div>{contact.team}</div>
            <div className="flex flex-wrap gap-1">
              {contact.coverage.slice(0, 3).map((s) => <Badge key={s} tone="slate">{s}</Badge>)}
            </div>
            {contact.recentDeals[0] && (
              <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
                <MicroLabel>Referenced Deal</MicroLabel>
                <div className="text-slate-700">{contact.recentDeals[0].company} · {contact.recentDeals[0].value}</div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <MicroLabel className="mb-1.5">Variant</MicroLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {VARIANTS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVariant(v.key)}
                  className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                    variant === v.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium">{v.label}</div>
                  <div className={variant === v.key ? "text-slate-300" : "text-slate-400"}>{v.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => regenerate(variant)}>
            <RefreshCw size={13} /> Regenerate draft
          </Button>
          <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={enrichWithAI} disabled={enriching}>
            {enriching ? <Spinner size={13} /> : <Wand2 size={13} />} Enrich with AI
          </Button>
        </div>

        {/* Right: editor */}
        <div className="flex flex-col p-5">
          {/* Subject A/B */}
          <MicroLabel className="mb-1.5">Subject — A/B options</MicroLabel>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {subjects.map((s, i) => (
              <button
                key={i}
                onClick={() => setSubject(s)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  subject === s ? "border-slate-900 bg-slate-100 text-slate-900" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-3 h-9 w-full rounded-md border border-slate-300 px-3 text-sm font-medium focus-ring"
          />

          <div className="mb-1.5 flex items-center justify-between">
            <MicroLabel>Email body</MicroLabel>
            <span className={`text-[11px] ${overLimit ? "text-amber-600" : "text-slate-400"}`}>
              {wc} words {overLimit && "· trim under 150"}
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm leading-relaxed focus-ring"
          />

          {overLimit && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle size={13} /> Wall Street etiquette: keep cold outreach under 150 words.
            </div>
          )}

          {/* Attach */}
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={attach}
              disabled={!resume?.fileDataUrl}
              onChange={(e) => setAttach(e.target.checked)}
              className="accent-slate-900"
            />
            <Paperclip size={13} />
            {resume?.fileDataUrl
              ? `Attach resume (${resume.fileName || "resume.pdf"})`
              : "Attach resume — upload one in Resume Intel first"}
          </label>

          {/* To line */}
          <div className="mt-3 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <span className="micro-label">To</span>
            <span className="text-slate-700">{to || "no email on file"}</span>
            <span className="ml-auto text-slate-400">Optimal: {formatDateTime(optimal)}</span>
          </div>

          {/* status line */}
          {(done || error) && (
            <div className={`mt-3 rounded-md border p-2.5 text-xs ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
              {error ? error : <span className="flex items-center gap-1"><Check size={13} /> {done}</span>}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={doSendNow} disabled={busy !== null || !to}>
              {busy === "send" ? <Spinner size={14} /> : <Send size={14} />} Send Now
            </Button>
            <Button variant="secondary" onClick={() => doQueue("schedule")} disabled={busy !== null || !to}>
              <CalendarClock size={14} /> Auto-Schedule
            </Button>
            <Button variant="outline" onClick={() => doQueue("queue")} disabled={busy !== null || !to}>
              <ListPlus size={14} /> Add to Queue
            </Button>
            {!canSend && (
              <span className="text-[11px] text-slate-400">Connect Gmail to deliver for real — drafts still queue.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
