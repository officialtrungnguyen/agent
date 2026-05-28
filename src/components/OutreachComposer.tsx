import { MailPlus, Paperclip, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { Contact, EmailVariant, QueuedEmail, ResumeProfile } from "../types";
import { buildIcebreakers, createQueuedEmail, generateEmail, generateFollowUp } from "../lib/intelligence";
import { uid } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Select, Textarea, Input } from "./ui/Form";

interface OutreachComposerProps {
  contact?: Contact;
  resume: ResumeProfile;
  onQueue: (email: QueuedEmail) => void;
}

const variants: EmailVariant[] = ["Short", "Relationship-First", "Deal-Referenced", "Aggressive"];

export function OutreachComposer({ contact, resume, onQueue }: OutreachComposerProps) {
  const [variant, setVariant] = useState<EmailVariant>("Deal-Referenced");
  const [attachResume, setAttachResume] = useState(true);
  const generated = useMemo(() => (contact ? generateEmail(contact, resume, variant) : undefined), [contact, resume, variant]);
  const [manualBody, setManualBody] = useState("");
  const [manualSubject, setManualSubject] = useState("");

  if (!contact || !generated) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-500">
          Select a contact to generate hyper-personalized outreach.
        </CardContent>
      </Card>
    );
  }

  const subject = manualSubject || generated.subject;
  const body = manualBody || generated.body;
  const hooks = buildIcebreakers(contact, resume);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="micro-label">Hyper-Personalized Composer</p>
            <h2 className="text-lg font-semibold text-slate-950">Generate best email for {contact.firstName}</h2>
          </div>
          <Button
            variant="primary"
            onClick={() =>
              onQueue({
                ...createQueuedEmail(contact, resume, variant, attachResume),
                id: uid("queue"),
                subject,
                body
              })
            }
          >
            <MailPlus className="h-4 w-4" /> Queue for Gmail
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="micro-label">Variant</span>
            <Select value={variant} onChange={(event) => setVariant(event.target.value as EmailVariant)}>
              {variants.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="micro-label">Subject A/B options</span>
            <Select value={subject} onChange={(event) => setManualSubject(event.target.value)}>
              {generated.subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {hooks.slice(0, 3).map((hook) => (
            <Badge key={hook} tone="blue">
              {hook.slice(0, 54)}...
            </Badge>
          ))}
        </div>

        <label className="space-y-1">
          <span className="micro-label">Subject</span>
          <Input value={subject} onChange={(event) => setManualSubject(event.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="micro-label">Preview</span>
          <Textarea rows={10} value={body} onChange={(event) => setManualBody(event.target.value)} />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input type="checkbox" checked={attachResume} onChange={(event) => setAttachResume(event.target.checked)} />
            <Paperclip className="h-4 w-4" />
            Attach original resume / tailored one-pager
          </label>
          {resume.originalAttachment ? <Badge tone="green">{resume.originalAttachment.fileName}</Badge> : <Badge tone="amber">No uploaded file yet</Badge>}
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-slate-600" />
            <p className="micro-label">7-day / 14-day smart follow-up draft</p>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-700">{generateFollowUp(contact).body}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
