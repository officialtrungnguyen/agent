import { useEffect, useMemo, useState } from "react";
import { Paperclip, Send, Sparkles, TimerReset } from "lucide-react";
import { Contact, EmailVariant, GeneratedEmail, ResumeProfile, ResumeVariant } from "../types";
import { generateEmailDraft } from "../utils";
import { Badge, Button, Card, Label, SectionHeading, Select, Textarea } from "./ui";

interface OutreachComposerProps {
  contact: Contact;
  resume: ResumeProfile | null;
  latestVariant: ResumeVariant | null;
  prefillBody: string | null;
  onClearPrefill: () => void;
  onDispatch: (
    mode: "queue" | "send" | "schedule",
    payload: {
      variant: EmailVariant;
      subject: string;
      body: string;
      scheduledFor: string;
      attachTailoredResume: boolean;
    },
  ) => Promise<void> | void;
}

const variantOptions: EmailVariant[] = ["Short", "Relationship-First", "Deal-Referenced", "Aggressive"];

export const OutreachComposer = ({
  contact,
  resume,
  latestVariant,
  prefillBody,
  onClearPrefill,
  onDispatch,
}: OutreachComposerProps) => {
  const [variant, setVariant] = useState<EmailVariant>("Short");
  const [draft, setDraft] = useState<GeneratedEmail>(() => generateEmailDraft(contact, resume, "Short"));
  const [subject, setSubject] = useState(draft.subjectOptions[0]);
  const [body, setBody] = useState(draft.body);
  const [scheduledFor, setScheduledFor] = useState(draft.optimalSendAt.slice(0, 16));
  const [attachTailoredResume, setAttachTailoredResume] = useState(true);

  const selectedSubjects = useMemo(() => draft.subjectOptions, [draft]);

  useEffect(() => {
    const nextDraft = generateEmailDraft(contact, resume, variant);
    setDraft(nextDraft);
    setSubject(nextDraft.subjectOptions[0]);
    setBody(nextDraft.body);
    setScheduledFor(nextDraft.optimalSendAt.slice(0, 16));
  }, [contact, resume, variant]);

  useEffect(() => {
    if (!prefillBody) return;
    setBody(prefillBody);
    onClearPrefill();
  }, [prefillBody, onClearPrefill]);

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="Hyper-Personalized Outreach Composer"
        title="Generate the best cold email fast, then send now or schedule with banker-specific timing"
        description="Every draft pulls from the resume, current banker team, recent transaction set, and shared school hooks while staying short, polished, and coffee-chat friendly."
      />

      <div className="grid gap-5 p-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Variant</Label>
              <Select value={variant} onChange={(event) => setVariant(event.target.value as EmailVariant)}>
                {variantOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Optimal send window</Label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <Card className="p-4">
            <div className="mono-label">A/B Subject Lines</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSubjects.map((subjectLine) => (
                <button
                  key={subjectLine}
                  onClick={() => setSubject(subjectLine)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    subject === subjectLine
                      ? "border-slate-500 bg-slate-100 text-slate-950"
                      : "border-slate-800 bg-slate-950/60 text-slate-300"
                  }`}
                >
                  {subjectLine}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-400">
              Selected: <span className="text-slate-100">{subject}</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mono-label">Context Stack</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="muted">{contact.school} alumni tie</Badge>
              <Badge tone="muted">{contact.teamDesk}</Badge>
              <Badge tone="muted">{contact.coverageSectors[0]}</Badge>
              <Badge tone="muted">{latestVariant ? "Tailored one-pager ready" : "Original resume only"}</Badge>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
              Resume anchor: {resume?.achievements[0]?.text ?? "Upload a resume to deepen personalization."}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email body</Label>
            <Textarea className="min-h-[280px]" value={body} onChange={(event) => setBody(event.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={attachTailoredResume}
              onChange={(event) => setAttachTailoredResume(event.target.checked)}
            />
            <Paperclip className="h-4 w-4" />
            Attach {latestVariant ? "tailored one-pager" : "original resume"} when available
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                onDispatch("send", {
                  variant,
                  subject,
                  body,
                  scheduledFor: new Date().toISOString(),
                  attachTailoredResume,
                })
              }
            >
              <Send className="h-4 w-4" />
              Send now
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                onDispatch("schedule", {
                  variant,
                  subject,
                  body,
                  scheduledFor: new Date(scheduledFor).toISOString(),
                  attachTailoredResume,
                })
              }
            >
              <TimerReset className="h-4 w-4" />
              Auto-schedule
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onDispatch("queue", {
                  variant,
                  subject,
                  body,
                  scheduledFor: new Date(scheduledFor).toISOString(),
                  attachTailoredResume,
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              Add to queue
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
