import { ChangeEvent, DragEvent, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { ParsedResume, UserProfile } from "../types";
import { parseResumeText } from "../lib/aiEngine";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

interface ResumeIntelligenceProps {
  resume?: ParsedResume;
  profile: UserProfile;
  onResumeChange: (resume: ParsedResume) => void;
  onProfileChange: (profile: UserProfile) => void;
}

export function ResumeIntelligence({
  resume,
  profile,
  onResumeChange,
  onProfileChange
}: ResumeIntelligenceProps) {
  const [isDragging, setIsDragging] = useState(false);

  async function parseFile(file: File) {
    const dataUrl = await readAsDataUrl(file);
    let text = "";

    if (file.type.includes("pdf")) {
      const buffer = await file.arrayBuffer();
      text = new TextDecoder("utf-8", { fatal: false }).decode(buffer).replace(/[^\x20-\x7E\n]/g, " ");
    } else {
      text = await file.text();
    }

    onResumeChange(parseResumeText(text, file.name, file.type, dataUrl));
  }

  function handleFiles(files?: FileList | null) {
    const file = files?.[0];
    if (file) void parseFile(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resume Intelligence</p>
        <h2 className="text-lg font-semibold">Candidate operating profile</h2>
        <p className="text-sm text-slate-600">
          Upload once, then every email, score, and bullet is tailored from your stored resume and pitch.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition ${
            isDragging ? "border-slate-950 bg-slate-100" : "border-slate-300 bg-slate-50"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadCloud className="mb-2 h-6 w-6 text-slate-500" />
          <span className="text-sm font-medium text-slate-900">Drop resume PDF/text or click to upload</span>
          <span className="mt-1 text-xs text-slate-500">Original file is retained for Gmail attachments.</span>
          <input
            className="hidden"
            type="file"
            accept=".pdf,.txt,.md,.doc,.docx,text/plain,application/pdf"
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Name</span>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
              value={profile.name}
              onChange={(event) => onProfileChange({ ...profile, name: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Gmail</span>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
              value={profile.email}
              onChange={(event) => onProfileChange({ ...profile, email: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">School</span>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
              value={profile.school}
              onChange={(event) => onProfileChange({ ...profile, school: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Target Role</span>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
              value={profile.targetRole}
              onChange={(event) => onProfileChange({ ...profile, targetRole: event.target.value })}
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Personal Pitch</span>
          <textarea
            className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            value={profile.personalPitch}
            onChange={(event) => onProfileChange({ ...profile, personalPitch: event.target.value })}
          />
        </label>

        {resume ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">{resume.fileName ?? "Parsed resume"}</span>
              </div>
              <Badge tone="green">Stored</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {resume.achievements.slice(0, 4).map((achievement) => (
                <li key={achievement}>- {achievement.replace(/^[-*•]\s*/, "")}</li>
              ))}
            </ul>
          </div>
        ) : (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() =>
              onResumeChange(
                parseResumeText(
                  "Finance student with DCF, LBO, M&A research, student investment fund, and alumni outreach experience."
                )
              )
            }
          >
            Seed premium fallback resume profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
