import { useRef, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { Contact, ResumeProfile, ResumeVariant } from "../types";
import { buildTailoredBullets, extractResumeFromFile } from "../utils";
import { Badge, Button, Card, Input, Label, SectionHeading, Textarea } from "./ui";

interface ResumeIntelligencePanelProps {
  resume: ResumeProfile | null;
  selectedContact: Contact;
  latestVariant: ResumeVariant | null;
  targetRole: string;
  personalPitch: string;
  onTargetRoleChange: (value: string) => void;
  onPersonalPitchChange: (value: string) => void;
  onSaveResume: (resume: ResumeProfile) => void;
  onSaveVariant: (variant: ResumeVariant) => void;
}

const arrayBufferToBase64 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return window.btoa(binary);
};

export const ResumeIntelligencePanel = ({
  resume,
  selectedContact,
  latestVariant,
  targetRole,
  personalPitch,
  onTargetRoleChange,
  onPersonalPitchChange,
  onSaveResume,
  onSaveVariant,
}: ResumeIntelligencePanelProps) => {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await extractResumeFromFile(file, targetRole, personalPitch);
      const attachmentContentBase64 = await arrayBufferToBase64(file);
      onSaveResume({
        ...parsed,
        attachmentMimeType: file.type || "application/octet-stream",
        attachmentContentBase64,
      } as ResumeProfile);
    } finally {
      setLoading(false);
    }
  };

  const generateVariant = () => {
    const bullets = buildTailoredBullets(selectedContact, resume);
    onSaveVariant({
      id: `${selectedContact.id}-${Date.now()}`,
      contactId: selectedContact.id,
      title: `${selectedContact.firm} / ${selectedContact.teamDesk}`,
      generatedAt: new Date().toISOString(),
      bullets,
    });
  };

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="Advanced Resume Intelligence"
        title="Upload once, parse into structured recruiting intel, then tailor one-pagers for each banker"
        description="BulgeBracket.ai extracts achievements, education, and skills from PDF or text resumes, stores them locally, and rewrites bullets to better map to each team or coverage vertical."
        actions={
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            Upload resume
          </Button>
        }
      />

      <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <Label>Target role</Label>
            <Input value={targetRole} onChange={(event) => onTargetRoleChange(event.target.value)} />
          </div>
          <div>
            <Label>Personal pitch</Label>
            <Textarea value={personalPitch} onChange={(event) => onPersonalPitchChange(event.target.value)} />
          </div>
          <div
            className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm leading-6 text-slate-400"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) void handleUpload(file);
            }}
          >
            <div className="mono-label">Drag / drop or click upload</div>
            <p className="mt-3">
              Supported formats: PDF and plain text. Structured achievements are persisted locally so you can reuse them across bankers, teams,
              and send variants without re-uploading.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => inputRef.current?.click()} disabled={loading}>
                {loading ? "Parsing..." : "Parse resume"}
              </Button>
              <Button variant="secondary" onClick={generateVariant}>
                <Sparkles className="h-4 w-4" />
                Tailor for selected banker
              </Button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="p-4">
            <div className="mono-label">Structured Resume Snapshot</div>
            {resume ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="font-medium text-slate-100">{resume.fileName}</div>
                  <div className="mt-1 text-sm text-slate-400">{resume.summary}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">Education</div>
                  <div className="mt-2 space-y-2 text-sm text-slate-400">
                    {resume.education.slice(0, 4).map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">Skills</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resume.skills.length === 0 ? <Badge tone="muted">No skills parsed yet</Badge> : null}
                    {resume.skills.slice(0, 8).map((skill) => (
                      <Badge key={skill} tone="muted">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                Upload a resume to activate fit scoring, tailored bullet generation, and contact-specific email personalization.
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mono-label">Tailored Resume Version / {selectedContact.firm}</div>
            <div className="mt-4 space-y-3">
              {(latestVariant?.bullets ?? buildTailoredBullets(selectedContact, resume)).map((bullet) => (
                <div key={bullet} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
                  {bullet}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 xl:col-span-2">
            <div className="mono-label">Achievement Bank</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {resume ? (
                resume.achievements.slice(0, 10).map((achievement) => (
                  <div key={achievement.text} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{achievement.section}</div>
                    <div className="mt-2 leading-6">{achievement.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Parsed achievements will appear here.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
