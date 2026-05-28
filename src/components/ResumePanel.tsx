import { Upload, Wand2 } from "lucide-react";
import type { Contact, ResumeProfile } from "../types";
import { buildTailoredBullets, getDefaultResume, parseResume, readResumeFile } from "../lib/intelligence";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Input, Textarea } from "./ui/Form";
import { Badge } from "./ui/Badge";

interface ResumePanelProps {
  resume: ResumeProfile;
  selectedContact?: Contact;
  onChange: (resume: ResumeProfile) => void;
}

export function ResumePanel({ resume, selectedContact, onChange }: ResumePanelProps) {
  async function handleFile(file?: File) {
    if (!file) return;
    const { text, attachment } = await readResumeFile(file);
    onChange(parseResume(text, file.name, attachment));
  }

  const tailored = selectedContact
    ? buildTailoredBullets(selectedContact, resume)
    : buildTailoredBullets(
        {
          ...({} as Contact),
          team: "Investment Banking",
          firm: "target firm",
          coverageSectors: ["M&A"],
          recentDeals: [{ company: "selected company", counterparty: "strategic buyer", type: "M&A", value: "$1B", date: "2025", angle: "strategic fit" }]
        },
        resume
      );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="micro-label">Resume Intelligence</p>
            <h2 className="text-lg font-semibold text-slate-950">Profile, pitch, and tailored bullets</h2>
          </div>
          <Button variant="ghost" onClick={() => onChange(getDefaultResume())}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-slate-950"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload className="mb-2 h-5 w-5 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">Drop resume PDF/text or click to upload</span>
          <span className="text-xs text-slate-500">Stored locally and attached to Gmail sends when selected</span>
          <input
            className="hidden"
            type="file"
            accept=".pdf,.txt,.md,.doc,.docx"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>

        {resume.fileName ? <Badge tone="blue">Loaded {resume.fileName}</Badge> : <Badge>Using premium fallback profile</Badge>}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="micro-label">Target role</span>
            <Input value={resume.targetRole} onChange={(event) => onChange({ ...resume, targetRole: event.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="micro-label">Top skills</span>
            <Input
              value={resume.skills.join(", ")}
              onChange={(event) => onChange({ ...resume, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) })}
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="micro-label">Personal pitch</span>
          <Textarea
            rows={3}
            value={resume.personalPitch}
            onChange={(event) => onChange({ ...resume, personalPitch: event.target.value })}
          />
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-slate-600" />
            <p className="micro-label">Tailored one-pager bullets</p>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            {tailored.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
