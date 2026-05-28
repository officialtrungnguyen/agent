import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, FileText, Mail, Paperclip, Send, Sparkles, X } from "lucide-react";
import { nanoid } from "nanoid";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import type { Contact, DraftEmail, EmailVariantStyle } from "@/types";

const VARIANTS: EmailVariantStyle[] = [
  { id: "short", label: "Short", description: "Crisp, low-pressure. Best for cold MDs." },
  { id: "relationship", label: "Relationship", description: "Lead with school tie + path." },
  { id: "deal", label: "Deal-Referenced", description: "Anchor on a recent mandate." },
  { id: "aggressive", label: "High Conviction", description: "Direct, confident, prepared." },
];

const SUBJECT_AB_PRESETS = (firm: string, sector: string) => [
  `${firm} — ${sector} — 15 min?`,
  `Quick question on the ${sector} desk`,
  `From a fellow alum — ${sector}`,
  `${sector} M&A — coffee chat?`,
];

/** AI-optimal send-time engine based on seniority + user's timezone. */
function optimalNextSlot(seniority: Contact["seniority"], tz: string): Date {
  const now = new Date();
  const localized = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const hourBand =
    seniority === "Analyst" ? [7, 9] :
    seniority === "Associate" ? [8, 10] :
    seniority === "Vice President" || seniority === "Director" || seniority === "Senior Vice President" ? [8, 10] :
    [9, 11];

  const target = new Date(localized);
  // pick the next weekday morning
  const todayHour = localized.getHours();
  if (todayHour >= hourBand[1]!) {
    // tomorrow
    target.setDate(target.getDate() + 1);
  }
  // skip to Monday if weekend
  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() + 1);
  }
  target.setHours(hourBand[0]!, Math.floor(Math.random() * 30) + 5, 0, 0);
  // Translate the localized time back to absolute time using offset
  const offsetMins = (now.getTime() - localized.getTime()) / 60000;
  return new Date(target.getTime() + offsetMins * 60_000);
}

export function OutreachComposerDialog() {
  const id = useAppStore((s) => s.composerOpenForId);
  const openComposer = useAppStore((s) => s.openComposer);
  const contact = useAppStore((s) => (id ? s.contacts.find((c) => c.id === id) : undefined));
  const resume = useAppStore((s) => s.resume);
  const preferences = useAppStore((s) => s.preferences);
  const addDraft = useAppStore((s) => s.addDraft);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const setStatus = useAppStore((s) => s.setStatus);
  const gmail = useAppStore((s) => s.gmail);
  const appendLog = useAppStore((s) => s.appendLog);

  const [variant, setVariant] = useState<EmailVariantStyle["id"]>("short");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [subjectVariants, setSubjectVariants] = useState<string[]>([]);
  const [attachResume, setAttachResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offlineWarn, setOfflineWarn] = useState(false);
  const [followUpMode, setFollowUpMode] = useState(false);

  useEffect(() => {
    if (!contact) return;
    setSubjectVariants(SUBJECT_AB_PRESETS(contact.firm, contact.coverage[0] ?? "M&A"));
  }, [contact]);

  useEffect(() => {
    if (!contact) return;
    setVariant("short");
    setSubject("");
    setBody("");
    setOfflineWarn(false);
    setFollowUpMode(false);
  }, [contact?.id]);

  async function regenerate(variantOverride?: EmailVariantStyle["id"]) {
    if (!contact) return;
    setLoading(true);
    const v = variantOverride ?? variant;
    setVariant(v);
    const res = await api.aiEmail({
      variant: v,
      resume: {
        userName: preferences.userName || "[Your Name]",
        targetRole: resume?.targetRole ?? preferences.targetRole,
        achievements: resume?.achievements ?? [],
        education: resume?.education ?? [{ school: preferences.school, degree: "B.S.", graduation: String(preferences.graduationYear ?? "") }],
        skills: resume?.skills ?? [],
        pitch: preferences.pitch,
        headline: resume?.headline ?? "",
      },
      contact: {
        fullName: contact.fullName,
        firstName: contact.firstName,
        firm: contact.firm,
        title: contact.title,
        seniority: contact.seniority,
        desk: contact.desk,
        city: contact.city,
        coverage: contact.coverage,
        school: contact.school,
        recentDeals: contact.recentDeals.map((d) => ({ target: d.target, acquirer: d.acquirer, value: d.value, product: d.product })),
        interests: contact.interests,
      },
    });
    if (res) {
      const sigBody = preferences.signature.replace("[Your Name]", preferences.userName || "[Your Name]");
      const bodyWithSig = res.body.includes(sigBody.split("\n")[0] ?? "") ? res.body : `${res.body}\n\n${sigBody}`;
      setSubject(res.subject);
      setBody(bodyWithSig);
      setOfflineWarn(res.offline);
      if (followUpMode) {
        // Reframe as follow-up
        const dayCount = contact.lastOutreachAt ? Math.max(7, Math.floor((Date.now() - new Date(contact.lastOutreachAt).getTime()) / (1000 * 60 * 60 * 24))) : 7;
        setSubject(`Re: ${res.subject}`);
        setBody(
          [
            `Hi ${contact.firstName},`,
            ``,
            `Bumping this in case it got buried — completely understand if calendars are tight.`,
            ``,
            `Saw your team's continued activity in ${contact.coverage[0] ?? "the sector"} (most recently ${contact.recentDeals[0]?.target ?? "another mandate"}) and figured I'd circle back. Would 15 minutes still work for you in the next two weeks?`,
            ``,
            `If now isn't the right time, no worries at all — I'm in this for the long run.`,
            ``,
            sigBody,
            ``,
            `— ${dayCount}-day follow-up`,
          ].join("\n"),
        );
      }
    }
    setLoading(false);
  }

  // Auto-generate on first open
  useEffect(() => {
    if (contact && !body && !loading) regenerate("short");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact?.id]);

  if (!contact) return null;

  const optimalAt = useMemo(() => optimalNextSlot(contact.seniority, preferences.timezone), [contact, preferences.timezone]);

  const buildAttachmentBase64 = (): { name: string; base64: string } | null => {
    if (!attachResume || !resume) return null;
    const filename = resume.fileName ?? "resume.txt";
    const base64 = btoa(unescape(encodeURIComponent(resume.rawText)));
    return { name: filename.endsWith(".txt") || filename.endsWith(".pdf") ? filename : `${filename}.txt`, base64 };
  }

  const persistDraft = (status: DraftEmail["status"], scheduledFor?: string, extras?: Partial<DraftEmail>): DraftEmail => {
    const draft: DraftEmail = {
      id: nanoid(8),
      contactId: contact!.id,
      variant,
      subject,
      body,
      attachResume,
      resumeFileName: resume?.fileName,
      createdAt: new Date().toISOString(),
      scheduledFor,
      status,
      ...extras,
    };
    addDraft(draft);
    return draft;
  }

  const handleSendNow = async () => {
    if (!contact.email) return;
    const att = buildAttachmentBase64();
    const draft = persistDraft("queued");
    const res = await api.gmailSend({
      to: contact.email,
      subject, body, contactId: contact.id, variant,
      attachmentName: att?.name, attachmentBase64: att?.base64,
    });
    if (res?.ok) {
      updateDraft(draft.id, { status: "sent", sentAt: new Date().toISOString() });
      setStatus(contact.id, "sent");
      useAppStore.getState().updateContact(contact.id, { lastOutreachAt: new Date().toISOString() });
      appendLog({ type: "email_sent", contactId: contact.id, summary: subject });
      openComposer(null);
    } else {
      updateDraft(draft.id, { status: "failed", failureReason: res?.error ?? "unknown" });
      alert(`Send failed: ${res?.error ?? "unknown"}`);
    }
  }

  const handleSchedule = async (at: Date) => {
    if (!contact.email) return;
    const att = buildAttachmentBase64();
    const draft = persistDraft("scheduled", at.toISOString());
    const res = await api.gmailSchedule({
      to: contact.email,
      subject, body, contactId: contact.id, variant,
      attachmentName: att?.name, attachmentBase64: att?.base64,
      scheduledFor: at.toISOString(),
    });
    if (res?.ok) {
      setStatus(contact.id, "scheduled");
      useAppStore.getState().updateContact(contact.id, { nextFollowupAt: at.toISOString() });
      appendLog({ type: "email_scheduled", contactId: contact.id, summary: `${subject} → ${at.toLocaleString()}` });
      openComposer(null);
    } else {
      updateDraft(draft.id, { status: "failed", failureReason: res?.error ?? "unknown" });
      alert(`Schedule failed: ${res?.error ?? "unknown"}`);
    }
  }

  const handleQueueOnly = () => {
    persistDraft("queued");
    setStatus(contact.id, "queued");
    appendLog({ type: "note", contactId: contact.id, summary: `Draft queued: ${subject}` });
    openComposer(null);
  }

  return (
    <Dialog open={!!id} onOpenChange={(open) => { if (!open) openComposer(null); }}>
      <DialogContent className="max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-graphite-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={contact.fullName} className="h-9 w-9" />
            <div>
              <DialogTitle>Hyper-Personalized Outreach</DialogTitle>
              <p className="text-xs text-graphite-500">{contact.fullName} · {contact.firm} · {contact.desk}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gmail.connected ? (
              <Badge variant="success" className="text-[10px]">Gmail · {gmail.identity?.email}</Badge>
            ) : gmail.configured ? (
              <Badge variant="warn" className="text-[10px]">Connect Gmail to enable real send</Badge>
            ) : (
              <Badge variant="muted" className="text-[10px]">Gmail simulation mode</Badge>
            )}
            <button onClick={() => openComposer(null)} aria-label="Close"><X className="h-4 w-4 text-graphite-500 hover:text-graphite-900" /></button>
          </div>
        </div>

        <div className="grid max-h-[calc(92vh-72px)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
          <aside className="border-r border-graphite-100 bg-graphite-50 p-4">
            <Tabs defaultValue="variant">
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="variant">Variant</TabsTrigger>
                <TabsTrigger className="flex-1" value="schedule">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="variant">
                <div className="space-y-2">
                  {VARIANTS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => regenerate(v.id)}
                      className={`flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors ${variant === v.id ? "border-graphite-900 bg-white" : "border-graphite-200 bg-white hover:border-graphite-400"}`}
                    >
                      <span className="text-[12px] font-semibold text-graphite-900">{v.label}</span>
                      <span className="text-[10px] text-graphite-500">{v.description}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setFollowUpMode((v) => !v); regenerate(); }}
                    className={`mt-2 w-full rounded-md border px-3 py-2 text-left text-[12px] font-medium transition-colors ${followUpMode ? "border-amber-400 bg-amber-50 text-amber-800" : "border-graphite-200 bg-white text-graphite-700 hover:border-graphite-400"}`}
                  >
                    {followUpMode ? "Follow-up mode · on" : "Switch to 7-day follow-up"}
                  </button>
                  <Button size="sm" className="mt-2 w-full" variant="default" onClick={() => regenerate()}>
                    <Sparkles className="h-3.5 w-3.5" /> {loading ? "Generating…" : "Regenerate"}
                  </Button>
                  {offlineWarn && (
                    <p className="text-[10px] text-graphite-500">Generated from premium offline templates (no API quota burned).</p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="microlabel mb-1.5">Subject A/B options</p>
                  <div className="space-y-1">
                    {subjectVariants.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSubject(s)}
                        className={`block w-full truncate rounded-md border px-2 py-1 text-left text-[11px] ${subject === s ? "border-graphite-900 bg-white text-graphite-900" : "border-graphite-200 bg-white text-graphite-700 hover:border-graphite-400"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-start gap-2 text-[11px] text-graphite-700">
                    <input type="checkbox" checked={attachResume} onChange={(e) => setAttachResume(e.target.checked)} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-graphite-900">Attach resume</span>
                      <br />
                      <span className="text-graphite-500">
                        {resume ? `Will attach ${resume.fileName ?? "your tailored resume"}` : "No resume uploaded yet"}
                      </span>
                    </span>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="schedule">
                <div className="space-y-3 text-[12px]">
                  <div className="rounded-md border border-graphite-200 bg-white p-3">
                    <p className="microlabel mb-1">Optimal next slot</p>
                    <p className="font-medium text-graphite-900">{optimalAt.toLocaleString()}</p>
                    <p className="text-[10px] text-graphite-500">
                      {contact.seniority === "Analyst" ? "Analyst window 7-9am local" : contact.seniority === "Managing Director" || contact.seniority === "Partner" ? "MD window 9-11am local" : "VP/Director window 8-10am local"}
                    </p>
                    <Button size="sm" className="mt-2 w-full" variant="default" onClick={() => handleSchedule(optimalAt)}>
                      <Clock className="h-3.5 w-3.5" /> Auto-schedule
                    </Button>
                  </div>
                  <PickerCustomSchedule onSchedule={handleSchedule} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-2 rounded-md border border-graphite-200 bg-white p-3 text-[11px] text-graphite-600">
              <p className="microlabel">AI fit reasoning</p>
              <ul className="space-y-0.5">
                {contact.fitReasoning.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-1.5"><span className="text-graphite-400">•</span>{r}</li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto p-5">
            <div className="mb-3">
              <label className="microlabel">To</label>
              <Input value={contact.email} readOnly className="bg-graphite-50" />
            </div>
            <div className="mb-3">
              <label className="microlabel">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sharp, specific, ≤ 60 chars" />
            </div>
            <div className="mb-3">
              <label className="microlabel flex items-center justify-between">
                <span>Body · {body.split(/\s+/).filter(Boolean).length} words</span>
                <span className="text-[10px] text-graphite-500">Target: ≤ 150 words. Wall Street etiquette.</span>
              </label>
              <Textarea rows={18} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-[13px] leading-relaxed" />
            </div>
            {attachResume && resume && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-graphite-200 bg-graphite-50 px-2.5 py-1.5 text-[11px] text-graphite-700">
                <Paperclip className="h-3 w-3" />
                <span>{resume.fileName ?? "resume.txt"}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-graphite-100 pt-3">
              <div className="flex items-center gap-1 text-[11px] text-graphite-500">
                <FileText className="h-3 w-3" />
                <span>Persistent local draft autosave</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handleQueueOnly}>
                  Queue only
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleSchedule(optimalAt)}>
                  <Calendar className="h-3.5 w-3.5" /> Schedule {optimalAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </Button>
                <Button size="sm" variant="default" onClick={handleSendNow} disabled={!subject || !body}>
                  <Send className="h-3.5 w-3.5" /> {gmail.connected ? "Send via Gmail" : gmail.configured ? "Connect & send" : "Simulate send"}
                </Button>
              </div>
            </div>
            {!gmail.configured && (
              <p className="mt-2 text-[10px] text-graphite-500">
                Real Gmail send/schedule unlocks the moment GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are configured. The app behaves identically in simulation mode so you can practice the whole pipeline.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PickerCustomSchedule({ onSchedule }: { onSchedule: (d: Date) => void }) {
  const tomorrow8 = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 30, 0, 0);
    return d;
  }, []);
  const [iso, setIso] = useState(toLocalISO(tomorrow8));

  return (
    <div className="rounded-md border border-graphite-200 bg-white p-3">
      <p className="microlabel mb-1">Custom schedule</p>
      <Input type="datetime-local" value={iso} onChange={(e) => setIso(e.target.value)} />
      <Button size="sm" variant="default" className="mt-2 w-full" onClick={() => onSchedule(new Date(iso))}>
        <Mail className="h-3.5 w-3.5" /> Schedule send
      </Button>
    </div>
  );
}

function toLocalISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
