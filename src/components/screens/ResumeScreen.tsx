import { useState } from "react";
import { FileText, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { parseResumeText } from "@/lib/resumeParser";
import type { UserResume } from "@/types";

const SAMPLE_RESUME = `Aspiring Investment Banking Analyst — Healthcare & Technology M&A

EDUCATION
University of Pennsylvania — The Wharton School
Bachelor of Science in Economics · Concentrations in Finance & Statistics · 2026
GPA: 3.92/4.00 · Joseph Wharton Scholar · Dean's List

EXPERIENCE
Lazard — Summer Analyst Intern · New York · Jun 2025 – Aug 2025
• Built three-statement operating models supporting a $1.2B carve-out for a healthcare diagnostics client
• Conducted precedent transaction analysis on 22 healthcare M&A deals from 2020-2024
• Authored sector deep-dive on payer-provider consolidation for the firm's institutional client briefing

Wharton Investment Management Club — Healthcare Analyst · 2024 – Present
• Pitched a long thesis on a mid-cap healthcare services name that returned 28% in 11 months
• Lead a team of four junior analysts; manage research workflow and present weekly to the IC

J.P. Morgan — Sophomore Diversity Banking Insight Program · Summer 2024
• Completed full IB analyst training: accounting, valuation, LBO, M&A modeling

SKILLS
Financial Modeling · DCF / LBO / M&A · Capital IQ · FactSet · Bloomberg Terminal · Python · SQL · VBA

LEADERSHIP
• Co-Founder, Wharton Restructuring & Distressed Investing Club
• Volunteer mentor, Sponsors for Educational Opportunity (SEO)
`;

export function ResumeScreen() {
  const resume = useAppStore((s) => s.resume);
  const setResume = useAppStore((s) => s.setResume);
  const clearResume = useAppStore((s) => s.clearResume);
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const bulkRescore = useAppStore((s) => s.bulkRescore);

  const [text, setText] = useState<string>(resume?.rawText ?? "");
  const [fileName, setFileName] = useState<string | undefined>(resume?.fileName);
  const [draggingOver, setDraggingOver] = useState(false);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    if (file.type.includes("pdf") || file.name.endsWith(".pdf")) {
      try {
        const text = await extractPdfText(file);
        setText(text);
      } catch (err) {
        alert("Could not parse PDF. Paste your resume text below as a fallback.");
        console.error(err);
      }
    } else {
      const text = await file.text();
      setText(text);
    }
  }

  function commit() {
    if (!text.trim()) return;
    const parsed = parseResumeText(text, fileName);
    parsed.targetRole = preferences.targetRole;
    setResume(parsed);
    bulkRescore();
  }

  function reset() {
    clearResume();
    setText("");
    setFileName(undefined);
  }

  function useSample() {
    setText(SAMPLE_RESUME);
    setFileName("sample-wharton-analyst.txt");
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="microlabel">Personal Intelligence</p>
          <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Resume Intel</h1>
          <p className="text-xs text-graphite-500">
            Upload once. The AI parses achievements, education, and skills, then uses them to tailor every email + score every banker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {resume && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <Button size="sm" variant="default" onClick={commit} disabled={!text.trim()}>
            <Sparkles className="h-3.5 w-3.5" /> Parse & Activate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-graphite-900">Upload or Paste</h2>
              <p className="text-[11px] text-graphite-500">PDF or plain text. Stored locally — never leaves your machine without explicit send.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={useSample}>
              Load sample
            </Button>
          </div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDraggingOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`mb-3 flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-xs transition-colors ${draggingOver ? "border-graphite-900 bg-graphite-50" : "border-graphite-200 hover:border-graphite-400"}`}
          >
            <Upload className="h-4 w-4 text-graphite-500" />
            <span className="font-medium text-graphite-700">
              {fileName ? `Loaded · ${fileName}` : "Drag a PDF or .txt resume here, or click to choose"}
            </span>
            <input type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={onUpload} />
          </label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={18} placeholder="Paste your resume text here…" />
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-graphite-900">Targets & Pitch</h2>
            <p className="mb-3 text-[11px] text-graphite-500">The AI uses these to score bankers, pick subject lines, and steer every variant.</p>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Your name" value={preferences.userName} onChange={(v) => setPreferences({ userName: v })} placeholder="Alexander Chen" />
              <Field label="Your email" value={preferences.userEmail} onChange={(v) => setPreferences({ userEmail: v })} placeholder="you@school.edu" />
              <Field label="School (long form for email tie-ins)" value={preferences.school} onChange={(v) => setPreferences({ school: v })} placeholder="University of Pennsylvania — Wharton" />
              <Field label="Target role" value={preferences.targetRole} onChange={(v) => setPreferences({ targetRole: v })} placeholder="Summer Investment Banking Analyst — Healthcare M&A" />
              <div>
                <label className="microlabel">Personal pitch (≤ 2 sentences)</label>
                <Textarea
                  rows={3}
                  value={preferences.pitch}
                  onChange={(e) => setPreferences({ pitch: e.target.value })}
                  placeholder="What makes you sharper than 90% of applicants?"
                />
              </div>
              <div>
                <label className="microlabel">Email signature</label>
                <Textarea
                  rows={3}
                  value={preferences.signature}
                  onChange={(e) => setPreferences({ signature: e.target.value })}
                />
              </div>
            </div>
          </div>

          {resume && <ParsedSummary resume={resume} />}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="microlabel">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ParsedSummary({ resume }: { resume: UserResume }) {
  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-graphite-500" />
        <h2 className="text-sm font-semibold text-graphite-900">Parsed structure</h2>
      </div>
      <div className="space-y-3 text-xs">
        <Section label="Headline">
          <p className="text-[12px] text-graphite-900">{resume.headline}</p>
        </Section>
        {resume.education.length > 0 && (
          <Section label="Education">
            <ul className="space-y-0.5 text-graphite-700">
              {resume.education.map((e, i) => (
                <li key={i} className="text-[11px]">{e.school} · {e.degree} {e.graduation && `· ${e.graduation}`}</li>
              ))}
            </ul>
          </Section>
        )}
        {resume.achievements.length > 0 && (
          <Section label={`Achievements (${resume.achievements.length})`}>
            <ul className="space-y-1 text-graphite-700">
              {resume.achievements.slice(0, 8).map((a, i) => (
                <li key={i} className="rounded-md border border-graphite-100 bg-graphite-50 px-2 py-1 text-[11px]">• {a}</li>
              ))}
            </ul>
          </Section>
        )}
        {resume.skills.length > 0 && (
          <Section label="Skills">
            <div className="flex flex-wrap gap-1">
              {resume.skills.slice(0, 16).map((s) => (
                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="microlabel mb-1">{label}</p>
      {children}
    </div>
  );
}

/**
 * Best-effort PDF text extraction in the browser.
 * Uses a tiny inline approach: read as text. For real PDFs the user can paste
 * the text or upload a .txt version. We don't bundle pdfjs in the client to
 * keep build slim; the server has pdf-parse available for future API endpoint.
 */
async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let text = "";
  let inText = false;
  for (let i = 0; i < bytes.length - 2; i++) {
    const ch = String.fromCharCode(bytes[i]!);
    const nx = String.fromCharCode(bytes[i + 1]!);
    if (!inText && ch === "(" && nx !== "\\") {
      inText = true;
      continue;
    }
    if (inText && ch === ")") {
      text += " ";
      inText = false;
      continue;
    }
    if (inText) {
      if (/[\x20-\x7e\n]/.test(ch)) text += ch;
    }
  }
  return text.replace(/\s+/g, " ").trim();
}
