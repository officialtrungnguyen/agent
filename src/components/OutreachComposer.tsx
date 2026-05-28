import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { Contact, EmailDraft, OutreachTone, ResumeProfile } from "@/types";
import { generateEmailDraft } from "@/lib/emailGeneration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OutreachComposerProps {
  contact: Contact | null;
  resumeProfile: ResumeProfile | null;
  currentDraft: EmailDraft | null;
  onDraftChange: (draft: EmailDraft | null) => void;
  onQueueDraft: (draft: EmailDraft) => void;
}

const toneOptions: Array<{ value: OutreachTone; label: string }> = [
  { value: "short", label: "Short" },
  { value: "relationship_first", label: "Relationship-First" },
  { value: "deal_referenced", label: "Deal-Referenced" },
  { value: "aggressive", label: "Aggressive" },
];

export function OutreachComposer({
  contact,
  resumeProfile,
  currentDraft,
  onDraftChange,
  onQueueDraft,
}: OutreachComposerProps) {
  const [tone, setTone] = useState<OutreachTone>("short");

  const tailoredBullets = useMemo(() => {
    if (!contact || !resumeProfile) return [];
    return resumeProfile.tailoredBulletsByDesk[contact.teamDesk] ?? [];
  }, [contact, resumeProfile]);

  function handleGenerate() {
    if (!contact) return;
    onDraftChange(generateEmailDraft(contact, resumeProfile, tone));
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Hyper-Personalized Outreach Composer</CardTitle>
        <div className="w-44">
          <Select
            value={tone}
            onChange={(event) => setTone(event.target.value as OutreachTone)}
            options={toneOptions}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={handleGenerate} disabled={!contact}>
            <Sparkles className="h-3 w-3" />
            Generate Best Email
          </Button>
          <Button
            variant="outline"
            onClick={() => currentDraft && onQueueDraft(currentDraft)}
            disabled={!currentDraft}
          >
            Queue Draft
          </Button>
        </div>

        {tailoredBullets.length > 0 && (
          <div className="rounded-md border border-slate-800 p-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">Tailored Resume One-Pager Bullets</p>
            <ul className="space-y-1 text-sm text-slate-200">
              {tailoredBullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>
        )}

        {currentDraft ? (
          <div className="space-y-2 rounded-md border border-slate-800 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {currentDraft.subjectOptions.map((subject) => (
                <button
                  key={subject}
                  className={`rounded-md border px-2 py-2 text-left text-xs ${
                    currentDraft.chosenSubject === subject
                      ? "border-slate-200 bg-slate-100 text-slate-900"
                      : "border-slate-700 bg-slate-950 text-slate-300"
                  }`}
                  onClick={() =>
                    onDraftChange({
                      ...currentDraft,
                      chosenSubject: subject,
                    })
                  }
                >
                  {subject}
                </button>
              ))}
            </div>
            <Textarea
              value={currentDraft.body}
              className="min-h-[190px]"
              onChange={(event) =>
                onDraftChange({
                  ...currentDraft,
                  body: event.target.value,
                })
              }
            />
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={currentDraft.includeTailoredResume}
                onChange={(event) =>
                  onDraftChange({
                    ...currentDraft,
                    includeTailoredResume: event.target.checked,
                  })
                }
              />
              Attach tailored resume one-pager (or original upload fallback)
            </label>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Generate a variant to preview, adjust, and queue.</p>
        )}
      </CardContent>
    </Card>
  );
}
