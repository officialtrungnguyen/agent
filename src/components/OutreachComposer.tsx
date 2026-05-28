import { useEffect, useMemo, useState } from "react";
import type { Contact, ResumeData, UserProfile, OutreachEmail } from "../types";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Pill } from "./ui/Pill";
import { FitScore } from "./FitScore";
import {
  generateEmail, generateAllVariants, type EmailVariant,
} from "../lib/ai/email";
import { optimalSendTime, describeWindow } from "../lib/ai/scheduler";
import { topResumeBullets } from "../lib/ai/resume";
import {
  Send, Clock, Paperclip, Sparkles, Copy, Check, RefreshCw, ListChecks,
} from "lucide-react";
import { gmailSend, gmailSchedule } from "../lib/gmailClient";

interface PresetPayload {
  subject: string;
  body: string;
  followUpOf?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
  resume: ResumeData | null;
  profile: UserProfile;
  oauthTokens: unknown;
  presetVariant?: EmailVariant;
  presetPayload?: PresetPayload;
  onQueued: (email: OutreachEmail) => void;
  onSent: (email: OutreachEmail) => void;
  markContactSent: (id: string) => void;
}

export function OutreachComposer({
  open, onClose, contact, resume, profile, oauthTokens, presetVariant, presetPayload, onQueued, onSent, markContactSent,
}: Props) {
  const [variant, setVariant] = useState<EmailVariant>(presetVariant || "short");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachResume, setAttachResume] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "auto" | "custom">("auto");
  const [customTime, setCustomTime] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const variants = useMemo(
    () => (contact ? generateAllVariants({ contact, resume, profile }) : []),
    [contact, resume, profile]
  );

  useEffect(() => {
    if (!contact) return;
    if (presetPayload) {
      setSubject(presetPayload.subject);
      setBody(presetPayload.body);
      setVariant(presetVariant || "short");
    } else {
      const v = presetVariant || variant;
      const g = generateEmail({ contact, resume, profile }, v);
      setSubject(g.subject);
      setBody(g.body);
      setVariant(v);
    }
    setAttachResume(false);
    setError(null);
    setInfo(null);
  }, [contact, presetVariant, presetPayload]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!contact) return;
    const opt = optimalSendTime(contact);
    setCustomTime(toLocalInput(opt));
  }, [contact]);

  function selectVariant(v: EmailVariant) {
    if (!contact) return;
    setVariant(v);
    const g = generateEmail({ contact, resume, profile }, v);
    setSubject(g.subject);
    setBody(g.body);
  }

  function regenerate() {
    if (!contact) return;
    const g = generateEmail({ contact, resume, profile }, variant);
    setSubject(g.subject);
    setBody(g.body);
  }

  async function buildAttachmentPayload() {
    if (!attachResume || !resume) return undefined;
    const lines: string[] = [];
    if (resume.candidate.name) lines.push(resume.candidate.name);
    if (resume.candidate.email) lines.push(resume.candidate.email);
    lines.push("");
    if (resume.education.length) {
      lines.push("EDUCATION");
      for (const e of resume.education) lines.push(`- ${e.school}${e.degree ? " — " + e.degree : ""}${e.gradYear ? " (" + e.gradYear + ")" : ""}${e.gpa ? " · GPA " + e.gpa : ""}`);
      lines.push("");
    }
    if (resume.experiences.length) {
      lines.push("EXPERIENCE");
      for (const ex of resume.experiences.slice(0, 4)) {
        lines.push(`- ${ex.title}${ex.company ? " — " + ex.company : ""}${ex.dates ? " (" + ex.dates + ")" : ""}`);
        for (const b of ex.bullets.slice(0, 5)) lines.push(`    • ${b}`);
      }
      lines.push("");
    }
    const bullets = topResumeBullets(resume, 6);
    if (bullets.length) {
      lines.push("TOP HIGHLIGHTS");
      for (const b of bullets) lines.push(`- ${b}`);
    }
    const text = lines.join("\n");
    const b64 = typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(text))) : "";
    const candidate = profile.name || resume.candidate.name || "candidate";
    const filename = `${candidate.replace(/\s+/g, "_")}_resume.txt`;
    return { filename, mimeType: "text/plain", base64: b64 };
  }

  function buildOutreach(status: OutreachEmail["status"], scheduledFor?: string): OutreachEmail {
    return {
      id: "e_" + Math.random().toString(36).slice(2, 10),
      contactId: contact!.id,
      subject,
      body,
      variant: presetPayload?.followUpOf ? "followup7" : variant,
      status,
      scheduledFor,
      sentAt: status === "sent" ? new Date().toISOString() : undefined,
      attachResume,
      resumeFileName: resume?.fileName,
      createdAt: new Date().toISOString(),
      parentEmailId: presetPayload?.followUpOf,
    };
  }

  async function sendNow() {
    if (!contact || !contact.email) {
      setError("This contact does not have a known email address.");
      return;
    }
    setSending(true); setError(null); setInfo(null);
    try {
      if (!profile.gmailConnected || !oauthTokens) {
        const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(url, "_blank", "noopener");
        const e = buildOutreach("sent");
        onSent(e); markContactSent(contact.id);
        setInfo("Opened Gmail web compose in a new tab (Gmail not yet authorized — authorize in Settings for true API sending).");
        return;
      }
      const attachment = await buildAttachmentPayload();
      await gmailSend({
        to: contact.email, subject, body,
        tokens: oauthTokens, attachment,
      });
      const e = buildOutreach("sent");
      onSent(e); markContactSent(contact.id);
      setInfo("Sent ✓ via Gmail.");
      setTimeout(() => onClose(), 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  async function schedule() {
    if (!contact || !contact.email) {
      setError("This contact does not have a known email address.");
      return;
    }
    setSending(true); setError(null); setInfo(null);
    try {
      const when = scheduleMode === "custom"
        ? new Date(customTime)
        : optimalSendTime(contact);
      if (!when || Number.isNaN(when.getTime())) {
        throw new Error("Invalid scheduled time.");
      }
      if (!profile.gmailConnected || !oauthTokens) {
        const e = buildOutreach("queued", when.toISOString());
        onQueued(e);
        setInfo(`Queued locally for ${when.toLocaleString()} (Gmail not yet authorized — connect to enable true send).`);
        setTimeout(() => onClose(), 800);
        return;
      }
      const attachment = await buildAttachmentPayload();
      await gmailSchedule({
        to: contact.email, subject, body,
        tokens: oauthTokens, attachment,
        scheduledFor: when.getTime(),
      });
      const e = buildOutreach("scheduled", when.toISOString());
      onQueued(e);
      setInfo(`Scheduled for ${when.toLocaleString()}.`);
      setTimeout(() => onClose(), 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  function copyAll() {
    void navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!contact) return null;
  const sendWindow = describeWindow(contact);
  const optimal = optimalSendTime(contact);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Compose — ${contact.firstName} ${contact.lastName}`}
      subtitle={`${contact.title} · ${contact.firm} · ${contact.team}`}
      footer={
        <>
          <Button variant="ghost" leading={copied ? <Check size={12} /> : <Copy size={12} />} onClick={copyAll}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" leading={<RefreshCw size={12} />} onClick={regenerate}>
            Regenerate
          </Button>
          <Button variant="ghost" leading={<Clock size={12} />} onClick={schedule} disabled={sending}>
            {scheduleMode === "now" ? "Queue" : "Schedule"}
          </Button>
          <Button variant="primary" leading={<Send size={12} />} onClick={sendNow} disabled={sending}>
            Send via Gmail
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-3">
          <div className="flex items-center gap-1 flex-wrap">
            {variants.map((v) => (
              <button
                key={v.variant}
                onClick={() => selectVariant(v.variant)}
                className={
                  "h-7 px-2.5 rounded-sharp border text-[11px] font-medium uppercase tracking-micro font-mono " +
                  (v.variant === variant
                    ? "bg-graphite-900 text-graphite-50 border-graphite-900"
                    : "bg-white text-graphite-700 border-graphite-200 hover:bg-graphite-50")
                }
              >
                {labelOf(v.variant)}
              </button>
            ))}
            <div className="ml-2 flex items-center gap-2 text-[11px] text-graphite-500">
              <Sparkles size={11} /> AI variant — instantly switch & regenerate
            </div>
          </div>

          <div>
            <label className="label">To</label>
            <input className="input" value={contact.email || ""} readOnly />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea
              className="input min-h-[280px] py-3 leading-relaxed font-sans"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="mt-1 flex items-center gap-3 micro">
              <span>{wordCount(body)} words</span>
              <span>{body.length} chars</span>
              <span className={wordCount(body) > 160 ? "text-amber-700" : "text-emerald-700"}>
                {wordCount(body) > 160 ? "Trim for Wall Street etiquette (<150 words)" : "Within Wall Street etiquette"}
              </span>
            </div>
          </div>

          <div className="hairline rounded-sharp p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="micro-strong">// SCHEDULING</div>
              <div className="micro">Optimal window for {contact.seniority}: {sendWindow}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-1 text-[12px]">
                <input type="radio" name="sm" checked={scheduleMode === "auto"} onChange={() => setScheduleMode("auto")} />
                Auto-pick optimal
              </label>
              <label className="inline-flex items-center gap-1 text-[12px]">
                <input type="radio" name="sm" checked={scheduleMode === "custom"} onChange={() => setScheduleMode("custom")} />
                Custom
              </label>
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                disabled={scheduleMode !== "custom"}
                className="input w-auto"
              />
              <div className="ml-auto micro">
                Next optimal: <span className="text-graphite-900 font-mono">{optimal.toLocaleString()}</span>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-[12px] pt-1">
              <input type="checkbox" checked={attachResume} onChange={(e) => setAttachResume(e.target.checked)} disabled={!resume} />
              <Paperclip size={12} /> Attach my resume as a one-pager{!resume && " (upload resume first)"}
            </label>
          </div>

          {error && <div className="hairline rounded-sharp p-3 text-[12.5px] bg-red-50 border-red-200 text-red-800">{error}</div>}
          {info && <div className="hairline rounded-sharp p-3 text-[12.5px] bg-emerald-50 border-emerald-200 text-emerald-800">{info}</div>}
        </div>

        <aside className="space-y-3">
          <div className="panel p-3">
            <div className="flex items-center justify-between">
              <div className="micro-strong">// FIT</div>
              <FitScore score={contact.fitScore} />
            </div>
            <div className="mt-2 text-[12px] text-graphite-700">{contact.team}</div>
            <div className="mt-1 micro">{contact.coverage.join(" · ")}</div>
          </div>
          <div className="panel p-3 space-y-2">
            <div className="micro-strong">// SUBJECT IDEAS</div>
            {(["short", "relationship", "deal", "aggressive"] as EmailVariant[]).map((v) => {
              const g = generateEmail({ contact, resume, profile }, v);
              return (
                <button
                  key={v}
                  onClick={() => { setSubject(g.subject); }}
                  className="block w-full text-left hairline rounded-sharp p-2 hover:bg-graphite-50 text-[12px]"
                  title="Use this subject"
                >
                  <span className="micro mr-1">[{labelOf(v)}]</span> {g.subject}
                </button>
              );
            })}
          </div>
          <div className="panel p-3 space-y-2">
            <div className="micro-strong">// RECENT DEALS</div>
            <ul className="space-y-1.5">
              {(contact.recentDeals || []).slice(0, 4).map((d, i) => (
                <li key={i} className="text-[11.5px]">
                  <Pill tone="neutral" className="mr-1">{d.value}</Pill>
                  <span className="text-graphite-700">{d.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-3">
            <div className="micro-strong mb-1">// ETIQUETTE CHECKLIST</div>
            <ul className="text-[11.5px] space-y-1 text-graphite-700">
              <Check2 ok={wordCount(body) <= 160}>≤ 150 words</Check2>
              <Check2 ok={/(thank|grateful)/i.test(body)}>Polite sign-off</Check2>
              <Check2 ok={/15 minutes|15-min|15 min/.test(body)}>Low-pressure 15-min ask</Check2>
              <Check2 ok={/\?/.test(body)}>Includes a clear question</Check2>
            </ul>
          </div>
          <div className="panel p-3">
            <div className="micro-strong mb-1"><ListChecks size={11} className="inline mr-1" /> SAVE ACTIONS</div>
            <div className="text-[12px] text-graphite-700">
              "Send via Gmail" sends instantly through your authorized Gmail. "Schedule" uses the optimal send-window engine.
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function labelOf(v: EmailVariant): string {
  return v === "short" ? "Short"
    : v === "relationship" ? "Relationship"
    : v === "deal" ? "Deal-Ref"
    : "Aggressive";
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function Check2({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-emerald-700" : "text-graphite-400"}>
        {ok ? "●" : "○"}
      </span>
      <span>{children}</span>
    </li>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
