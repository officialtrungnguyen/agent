import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateEmailDraft } from "../lib/ai";
import type { Contact, EmailVariant, OutreachEmail, UserProfile } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

interface OutreachComposerProps {
  contact?: Contact;
  profile: UserProfile;
  onSaveDraft: (draft: OutreachEmail, includeTailoredResume: boolean) => void;
}

const variants: Array<{ key: EmailVariant; label: string }> = [
  { key: "short", label: "Short" },
  { key: "relationship_first", label: "Relationship-First" },
  { key: "deal_referenced", label: "Deal-Referenced" },
  { key: "aggressive", label: "Aggressive" }
];

export const OutreachComposer = ({ contact, profile, onSaveDraft }: OutreachComposerProps) => {
  const [variant, setVariant] = useState<EmailVariant>("deal_referenced");
  const [subject, setSubject] = useState("");
  const [subjectB, setSubjectB] = useState("");
  const [body, setBody] = useState("");
  const [attachTailoredResume, setAttachTailoredResume] = useState(true);

  const generated = useMemo(() => {
    if (!contact) {
      return undefined;
    }
    return generateEmailDraft(contact, profile, variant);
  }, [contact, profile, variant]);

  useEffect(() => {
    if (!generated) {
      return;
    }
    setSubject(generated.subjectOptions[0] ?? "");
    setSubjectB(generated.subjectOptions[1] ?? "");
    setBody(generated.draft);
  }, [generated]);

  if (!contact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hyper-Personalized Outreach Composer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">Select a contact to generate premium outreach variants.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hyper-Personalized Outreach Composer</CardTitle>
        <Badge className="border-slate-600 text-slate-200">{contact.teamDesk}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Template Variant</p>
            <Select value={variant} onChange={(event) => setVariant(event.target.value as EmailVariant)}>
              {variants.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Subject A</p>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Subject B</p>
            <Input value={subjectB} onChange={(event) => setSubjectB(event.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Email Body (&lt;150 words)</p>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-[190px]" />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={attachTailoredResume}
            onChange={(event) => setAttachTailoredResume(event.target.checked)}
          />
          Attach tailored one-pager where available
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              onSaveDraft(
                {
                  id: crypto.randomUUID(),
                  contactId: contact.id,
                  subject,
                  body,
                  variant,
                  createdAt: new Date().toISOString(),
                  status: "draft"
                },
                attachTailoredResume
              )
            }
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Generate Best Email
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              onSaveDraft(
                {
                  id: crypto.randomUUID(),
                  contactId: contact.id,
                  subject: subjectB,
                  body,
                  variant,
                  createdAt: new Date().toISOString(),
                  status: "draft"
                },
                attachTailoredResume
              )
            }
          >
            Save A/B Variant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
