import { FileUp, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ResumeData } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface ResumeIntelligencePanelProps {
  resume?: ResumeData;
  selectedDesk?: string;
  onResumeChange: (resume: ResumeData) => void;
}

const skillKeywords = [
  "financial modeling",
  "valuation",
  "lbo",
  "dcf",
  "mergers",
  "powerpoint",
  "excel",
  "factset",
  "capital iq",
  "pitchbook"
];

const parsePdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const pdfjs = await import("pdfjs-dist");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const page = await pdf.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      })
    );
    return pages.join("\n");
  } catch {
    return new TextDecoder("utf-8").decode(new Uint8Array(arrayBuffer));
  }
};

const extractResumeData = (text: string): Omit<ResumeData, "targetRole" | "personalPitch" | "tailoredBulletsByDesk"> => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const achievements = lines
    .filter((line) => /^(•|-|\*)/.test(line) || /(built|led|supported|executed|modeled|analyzed)/i.test(line))
    .slice(0, 12);

  const lowered = text.toLowerCase();
  const skills = skillKeywords.filter((keyword) => lowered.includes(keyword));

  const education = lines
    .filter((line) => /(university|college|school|wharton|stern|mcintire|marshall)/i.test(line))
    .slice(0, 3)
    .map((line) => ({
      school: line,
      degree: "Finance / Economics",
      graduationYear: "2026"
    }));

  return {
    parsedText: text,
    achievements,
    skills,
    education
  };
};

const tailorBullets = (resume: ResumeData, desk: string) =>
  resume.achievements.slice(0, 3).map((achievement, index) => {
    const prefix = index === 0 ? `Tailored for ${desk}:` : "Desk-aligned:";
    return `${prefix} ${achievement.replace(/^[-•*]\s?/, "")}`;
  });

export const ResumeIntelligencePanel = ({ resume, selectedDesk, onResumeChange }: ResumeIntelligencePanelProps) => {
  const [isParsing, setIsParsing] = useState(false);
  const [targetRole, setTargetRole] = useState(resume?.targetRole ?? "Investment Banking Summer Analyst");
  const [personalPitch, setPersonalPitch] = useState(
    resume?.personalPitch ?? "High-agency finance student focused on M&A execution excellence."
  );

  const activeBullets = useMemo(() => {
    if (!resume || !selectedDesk) {
      return [];
    }
    return resume.tailoredBulletsByDesk[selectedDesk] ?? [];
  }, [resume, selectedDesk]);

  const onUpload = async (file: File) => {
    setIsParsing(true);
    const arrayBuffer = await file.arrayBuffer();
    const text = file.type.includes("pdf") ? await parsePdfText(arrayBuffer) : await file.text();
    const extracted = extractResumeData(text);
    onResumeChange({
      ...extracted,
      targetRole,
      personalPitch,
      tailoredBulletsByDesk: resume?.tailoredBulletsByDesk ?? {}
    });
    setIsParsing(false);
  };

  const onTailor = () => {
    if (!resume || !selectedDesk) {
      return;
    }

    onResumeChange({
      ...resume,
      targetRole,
      personalPitch,
      tailoredBulletsByDesk: {
        ...resume.tailoredBulletsByDesk,
        [selectedDesk]: tailorBullets(resume, selectedDesk)
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Resume Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label
          htmlFor="resume-upload"
          className="flex cursor-pointer items-center justify-between border border-dashed border-slate-700 px-3 py-3 text-sm text-slate-300 hover:border-slate-500"
        >
          <span>{isParsing ? "Parsing resume..." : "Drag and drop resume (PDF/Text) or click upload"}</span>
          <FileUp className="h-4 w-4" />
        </label>
        <input
          id="resume-upload"
          type="file"
          className="hidden"
          accept=".pdf,.txt"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void onUpload(file);
            }
          }}
        />

        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Target Role</p>
            <Input
              value={targetRole}
              onChange={(event) => {
                const value = event.target.value;
                setTargetRole(value);
                if (resume) {
                  onResumeChange({ ...resume, targetRole: value, personalPitch });
                }
              }}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Personal Pitch</p>
            <Input
              value={personalPitch}
              onChange={(event) => {
                const value = event.target.value;
                setPersonalPitch(value);
                if (resume) {
                  onResumeChange({ ...resume, personalPitch: value, targetRole });
                }
              }}
            />
          </div>
        </div>

        {resume && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="border border-slate-800 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Structured Achievements</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-200">
                  {resume.achievements.slice(0, 6).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-slate-800 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Skills</p>
                <Textarea value={resume.skills.join(", ")} readOnly />
              </div>
            </div>

            <div className="border border-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Desk-Tailored Bullets</p>
                <Button variant="outline" size="sm" onClick={onTailor} disabled={!selectedDesk}>
                  <Wand2 className="mr-1 h-3.5 w-3.5" /> Tailor For {selectedDesk ?? "Desk"}
                </Button>
              </div>
              <ul className="space-y-1 text-sm text-slate-200">
                {activeBullets.length > 0 ? (
                  activeBullets.map((bullet) => <li key={bullet}>• {bullet}</li>)
                ) : (
                  <li className="text-slate-500">Generate tailored bullets for a selected banker desk.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
