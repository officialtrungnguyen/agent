import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { Contact, ResumeProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ResumeIntelligencePanelProps {
  apiBaseUrl: string;
  selectedContact: Contact | null;
  resumeProfile: ResumeProfile | null;
  onUpdateResume: (profile: ResumeProfile) => void;
}

export function ResumeIntelligencePanel({
  apiBaseUrl,
  selectedContact,
  resumeProfile,
  onUpdateResume,
}: ResumeIntelligencePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function parseFile(file: File) {
    const formData = new FormData();
    formData.append("resume", file);
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Unable to parse resume");
      const payload = (await response.json()) as ResumeProfile;

      const rawBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(rawBuffer)));
      onUpdateResume({
        ...payload,
        uploadedFileName: file.name,
        uploadedMimeType: file.type || "application/octet-stream",
        uploadedBase64: base64,
      });
    } finally {
      setLoading(false);
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void parseFile(file);
  }

  function handleTailorBullets() {
    if (!resumeProfile || !selectedContact) return;
    const tailored = [
      `Built a transaction-ready valuation package aligned with ${selectedContact.teamDesk} mandates in ${selectedContact.coverageSectors[0]}.`,
      `Drafted buyer and diligence narratives referencing recent ${selectedContact.coverageSectors[1]} deal comps and investor appetite.`,
      `Synthesized operating KPI sensitivity analyses for live-process pacing across ${selectedContact.firm} coverage priorities.`,
    ];
    onUpdateResume({
      ...resumeProfile,
      tailoredBulletsByDesk: {
        ...resumeProfile.tailoredBulletsByDesk,
        [selectedContact.teamDesk]: tailored,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={`rounded-md border border-dashed p-4 text-center ${
            isDragging ? "border-slate-400 bg-slate-900" : "border-slate-700"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <Upload className="mx-auto mb-2 h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-200">Drag and drop PDF/TXT resume</p>
          <p className="text-xs text-slate-500">or upload manually</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? "Parsing..." : "Upload Resume"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void parseFile(file);
            }}
          />
        </div>

        <Input
          placeholder="Target role (e.g., Investment Banking Analyst)"
          value={resumeProfile?.targetRole ?? ""}
          onChange={(event) =>
            onUpdateResume({
              ...(resumeProfile ?? {
                rawText: "",
                achievements: [],
                skills: [],
                education: [],
                targetRole: "",
                personalPitch: "",
                tailoredBulletsByDesk: {},
                updatedAt: new Date().toISOString(),
              }),
              targetRole: event.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
        />
        <Textarea
          placeholder="Personal pitch (used in email sign-offs)"
          value={resumeProfile?.personalPitch ?? ""}
          onChange={(event) =>
            onUpdateResume({
              ...(resumeProfile ?? {
                rawText: "",
                achievements: [],
                skills: [],
                education: [],
                targetRole: "",
                personalPitch: "",
                tailoredBulletsByDesk: {},
                updatedAt: new Date().toISOString(),
              }),
              personalPitch: event.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleTailorBullets} disabled={!selectedContact || !resumeProfile}>
            Tailor Bullets for Selected Banker
          </Button>
        </div>

        {resumeProfile && (
          <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-md border border-slate-800 p-2">
              <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">Achievements</p>
              <ul className="space-y-1">
                {resumeProfile.achievements.slice(0, 4).map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-slate-800 p-2">
              <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">Skills</p>
              <ul className="space-y-1">
                {resumeProfile.skills.slice(0, 8).map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-slate-800 p-2">
              <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">Education</p>
              <ul className="space-y-1">
                {resumeProfile.education.slice(0, 3).map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
