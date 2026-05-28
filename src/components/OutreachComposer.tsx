import { useMemo, useState } from "react";
import { MailPlus, RefreshCw } from "lucide-react";
import { Contact, DraftEmail, EmailVariant, ParsedResume, UserProfile } from "../types";
import { generateEmailDraft, generateFollowUp, generateSubjectLines } from "../lib/aiEngine";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";

interface OutreachComposerProps {
  contact?: Contact;
  resume?: ParsedResume;
  profile: UserProfile;
  onQueue: (draft: DraftEmail) => void;
  onCopy: (text: string) => void;
}

const variants: EmailVariant[] = ["Short", "Relationship-First", "Deal-Referenced", "Aggressive"];

export function OutreachComposer({ contact, resume, profile, onQueue, onCopy }: OutreachComposerProps) {
  const [variant, setVariant] = useState<EmailVariant>("Deal-Referenced");
  const [attachResume, setAttachResume] = useState(true);
  const draft = useMemo(
    () => (contact ? generateEmailDraft(contact, resume, profile, variant, attachResume) : undefined),
    [attachResume, contact, profile, resume, variant]
  );

  if (!contact || !draft) {
    return (
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Outreach Composer</p>
          <h2 className="text-lg font-semibold">Generate best email</h2>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">Select a profile to generate compliant Wall Street outreach.</CardContent>
      </Card>
    );
  }

  const follow7 = generateFollowUp(contact, profile, 7);
  const subjectLines = generateSubjectLines(contact);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Hyper-Personalized Composer</p>
        <h2 className="text-lg font-semibold">Best email for {contact.firstName}</h2>
        <p className="text-sm text-slate-600">
          Under 150 words, banker-specific hook, precise team context, low-pressure coffee chat CTA.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {variants.map((candidate) => (
            <Button
              key={candidate}
              size="sm"
              variant={candidate === variant ? "primary" : "secondary"}
              onClick={() => setVariant(candidate)}
            >
              {candidate}
            </Button>
          ))}
        </div>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            A/B Subject Lines
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {subjectLines.map((subject) => (
              <button
                key={subject}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-slate-400"
                onClick={() => onCopy(subject)}
              >
                {subject}
              </button>
            ))}
          </div>
        </section>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subject</p>
              <p className="font-medium">{draft.subject}</p>
            </div>
            <Badge tone={attachResume ? "green" : "slate"}>{attachResume ? "Resume attached" : "No attachment"}</Badge>
          </div>
          <textarea
            className="min-h-64 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 outline-none focus:border-slate-950"
            value={draft.body}
            readOnly
          />
        </div>

        <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <span>Attach original resume or tailored one-pager</span>
          <input
            type="checkbox"
            checked={attachResume}
            onChange={(event) => setAttachResume(event.target.checked)}
          />
        </label>

        <div className="grid gap-2 md:grid-cols-3">
          <Button onClick={() => onQueue(draft)}>
            <MailPlus className="h-4 w-4" /> Queue email
          </Button>
          <Button variant="secondary" onClick={() => onCopy(draft.body)}>
            Copy body
          </Button>
          <Button variant="secondary" onClick={() => onCopy(`${follow7.subject}\n\n${follow7.body}`)}>
            <RefreshCw className="h-4 w-4" /> 7-day follow-up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
