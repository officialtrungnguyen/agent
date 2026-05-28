import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input, Label, Textarea } from "./ui/input";
import type { Contact, ResumeData } from "@/types";
import { parseResumeText, generateTailoredBullets } from "@/data/offlineAI";
import { loadResume, saveResume } from "@/lib/storage";

interface Props {
  selectedContact?: Contact | null;
  onResumeChange: (resume: ResumeData | null) => void;
}

export function ResumePanel({ selectedContact, onResumeChange }: Props) {
  const [resume, setResume] = useState<ResumeData | null>(() => loadResume());
  const [tailored, setTailored] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const applyResume = (r: ResumeData) => {
    setResume(r);
    saveResume(r);
    onResumeChange(r);
  };

  const handleFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = parseResumeText(text, file.name);
      applyResume(parsed);
    },
    [onResumeChange]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const generateTailored = () => {
    if (!resume || !selectedContact) return;
    setTailored(generateTailoredBullets(selectedContact, resume));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
            Resume Intelligence
          </span>
          <FileText className="h-4 w-4 text-graphite-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? "border-graphite-500 bg-graphite-50"
              : "border-graphite-300"
          }`}
        >
          <Upload className="mx-auto mb-2 h-6 w-6 text-graphite-400" />
          <p className="text-sm text-graphite-600">
            Drag & drop resume (PDF as text export) or paste below
          </p>
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            className="mt-2 text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>

        {resume ? (
          <>
            <div className="grid gap-2 text-sm">
              <p>
                <span className="text-graphite-500">Name:</span> {resume.name}
              </p>
              <p>
                <span className="text-graphite-500">School:</span>{" "}
                {resume.school}
              </p>
            </div>
            <div>
              <Label>Target Role</Label>
              <Input
                value={resume.targetRole}
                onChange={(e) => {
                  const next = { ...resume, targetRole: e.target.value };
                  applyResume(next);
                }}
              />
            </div>
            <div>
              <Label>Personal Pitch</Label>
              <Textarea
                value={resume.personalPitch}
                onChange={(e) => {
                  const next = { ...resume, personalPitch: e.target.value };
                  applyResume(next);
                }}
                rows={3}
              />
            </div>
            <div>
              <Label>Achievements</Label>
              <ul className="mt-1 list-inside list-disc text-xs text-graphite-700">
                {resume.achievements.slice(0, 5).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            {selectedContact && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={generateTailored}
              >
                Generate tailored bullets for {selectedContact.firstName}
              </Button>
            )}
            {tailored.length > 0 && (
              <div className="rounded border border-graphite-200 bg-graphite-50 p-3 text-xs">
                <p className="mb-2 font-mono text-[10px] uppercase text-graphite-500">
                  Tailored one-pager bullets
                </p>
                {tailored.map((b, i) => (
                  <p key={i} className="mb-1">
                    • {b}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <Label>Or paste resume text</Label>
            <Textarea
              placeholder="Paste resume content…"
              onBlur={(e) => {
                if (e.target.value.trim().length > 50) {
                  applyResume(parseResumeText(e.target.value));
                }
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
