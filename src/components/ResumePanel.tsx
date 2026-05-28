import { useRef, useState } from "react";
import type { ResumeData, UserProfile } from "../types";
import { parseResume, topResumeBullets } from "../lib/ai/resume";
import { Button } from "./ui/Button";
import { Pill } from "./ui/Pill";
import { FileText, Upload, Sparkles, Save, Trash2 } from "lucide-react";

interface Props {
  resume: ResumeData | null;
  setResume: (r: ResumeData | null) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}

export function ResumePanel({ resume, setResume, profile, setProfile }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState<string>(resume?.rawText || "");
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  async function ingestFile(f: File) {
    setSaving(true);
    try {
      let text = "";
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        text = await pdfToText(f);
      } else {
        text = await f.text();
      }
      const parsed = parseResume(text, f.name);
      setResume(parsed);
      setRawText(text);
    } finally {
      setSaving(false);
    }
  }

  function ingestText() {
    if (!rawText.trim()) return;
    const parsed = parseResume(rawText, resume?.fileName);
    setResume(parsed);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Upload Resume</div>
            <div className="micro mt-1">// pdf or text — parsed locally, never uploaded</div>
          </div>
          {resume && <Pill tone="green">Saved · {resume.fileName || "pasted"}</Pill>}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void ingestFile(f);
          }}
          onClick={() => fileInput.current?.click()}
          className={
            "cursor-pointer hairline rounded-sharp p-6 text-center transition-colors " +
            (dragOver ? "bg-graphite-100 border-graphite-400" : "hover:bg-graphite-50")
          }
        >
          <Upload className="mx-auto mb-2 text-graphite-500" size={20} />
          <div className="text-[13px] font-medium text-graphite-900">Drag & drop your resume here</div>
          <div className="text-[11px] text-graphite-500 mt-1">or click to choose a PDF / .txt file</div>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void ingestFile(f);
            }}
          />
        </div>

        <div>
          <div className="micro mb-1.5">// or paste resume text</div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your resume here — name, education, experience bullets..."
            className="input min-h-[180px] py-2 leading-relaxed"
          />
          <div className="flex items-center gap-2 mt-2">
            <Button variant="primary" leading={<Sparkles size={12} />} onClick={ingestText}>
              Parse & Save
            </Button>
            {resume && (
              <Button variant="ghost" leading={<Trash2 size={12} />} onClick={() => { setResume(null); setRawText(""); }}>
                Remove
              </Button>
            )}
            {saving && <span className="micro">parsing…</span>}
          </div>
        </div>

        <div className="space-y-2 hairline-t pt-4">
          <div className="text-sm font-semibold">Your Pitch & Target</div>
          <label className="label">Target Role</label>
          <input
            className="input"
            value={profile.targetRole}
            onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
            placeholder="Summer Analyst — M&A / Healthcare"
          />
          <label className="label">Target Class (optional)</label>
          <input
            className="input"
            value={profile.targetClass || ""}
            onChange={(e) => setProfile({ ...profile, targetClass: e.target.value })}
            placeholder="Summer 2027"
          />
          <label className="label">Display Name (for sign-offs)</label>
          <input
            className="input"
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Jane Smith"
          />
          <label className="label">Personal Pitch (used to personalize emails)</label>
          <textarea
            className="input min-h-[80px] py-2"
            value={profile.personalPitch}
            onChange={(e) => setProfile({ ...profile, personalPitch: e.target.value })}
            placeholder="1-2 sentences on who you are, what you've done, what you want."
          />
          <label className="label">Priority Firms (comma-separated)</label>
          <input
            className="input"
            value={profile.preferredFirms.join(", ")}
            onChange={(e) => setProfile({ ...profile, preferredFirms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Houlihan Lokey, Piper Sandler, Moelis & Company"
          />
          <div className="pt-1">
            <Button variant="ghost" leading={<Save size={12} />} onClick={() => setProfile({ ...profile })}>
              Save profile
            </Button>
          </div>
        </div>
      </section>

      <section className="panel p-5 space-y-4">
        <div className="text-sm font-semibold flex items-center gap-2">
          <FileText size={14} /> Parsed Resume Intelligence
        </div>
        {!resume ? (
          <div className="text-[13px] text-graphite-500">
            No resume yet. Upload one to unlock fit scoring and hyper-personalized email generation.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" value={resume.candidate.name} />
              <Field label="Email" value={resume.candidate.email} />
              <Field label="Phone" value={resume.candidate.phone} />
              <Field label="School" value={resume.education[0]?.school} />
            </div>

            <Block title="// EDUCATION">
              {resume.education.length ? (
                resume.education.map((e, i) => (
                  <div key={i} className="hairline rounded-sharp p-2">
                    <div className="text-[12.5px] font-medium">{e.school}</div>
                    {e.degree && <div className="text-[11px] text-graphite-600">{e.degree}</div>}
                    <div className="micro mt-1">{e.gradYear || ""} {e.gpa ? `· GPA ${e.gpa}` : ""}</div>
                  </div>
                ))
              ) : <Empty />}
            </Block>

            <Block title="// EXPERIENCE">
              {resume.experiences.length ? (
                resume.experiences.map((e, i) => (
                  <div key={i} className="hairline rounded-sharp p-2">
                    <div className="text-[12.5px] font-medium">{e.title} {e.company ? `— ${e.company}` : ""}</div>
                    {e.dates && <div className="micro">{e.dates}</div>}
                    <ul className="mt-1 space-y-0.5">
                      {e.bullets.slice(0, 6).map((b, j) => <li key={j} className="text-[12px] text-graphite-700">· {b}</li>)}
                    </ul>
                  </div>
                ))
              ) : <Empty />}
            </Block>

            <Block title="// TOP DEAL-READY BULLETS">
              <ul className="space-y-1">
                {topResumeBullets(resume, 5).map((b, i) => (
                  <li key={i} className="text-[12px] text-graphite-700">· {b}</li>
                ))}
              </ul>
            </Block>

            <Block title="// SKILLS">
              <div className="flex flex-wrap gap-1.5">
                {(resume.skills || []).slice(0, 24).map((s, i) => <Pill key={i}>{s}</Pill>)}
              </div>
            </Block>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="hairline rounded-sharp px-2.5 py-1.5">
      <div className="micro">{label}</div>
      <div className="text-[12.5px] text-graphite-900 mt-0.5">{value || "—"}</div>
    </div>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="micro-strong">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Empty() {
  return <div className="text-[12px] text-graphite-500">No structured data parsed yet.</div>;
}

// --- PDF text extraction using browser's native APIs ---
// Lightweight, dependency-free heuristic: read PDF as text and extract `Tj` operands.
// Good enough for resume keyword extraction without bringing in pdfjs-dist.
async function pdfToText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Decode latin1 to keep all bytes intact
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  const out: string[] = [];
  // Match (string) Tj  and [ (s1) (s2) ] TJ patterns
  const tj = /\(((?:\\\)|\\\(|[^()])*)\)\s*Tj/g;
  const tjArr = /\[((?:[^\]]|\\\])*)\]\s*TJ/g;
  let m;
  while ((m = tj.exec(str))) out.push(unescapePdfString(m[1]));
  while ((m = tjArr.exec(str))) {
    const inner = m[1];
    const re = /\(((?:\\\)|\\\(|[^()])*)\)/g;
    let mm;
    while ((mm = re.exec(inner))) out.push(unescapePdfString(mm[1]));
  }
  // Heuristic newline grouping by word density
  const joined = out.join(" ");
  // Try to inject line breaks at common separators in resumes
  return joined
    .replace(/\s+/g, " ")
    .replace(/(•|·|▪)/g, "\n• ")
    .replace(/([a-z])([A-Z]{2,})/g, "$1\n$2")
    .replace(/\s+(EDUCATION|EXPERIENCE|SKILLS|LEADERSHIP|PROJECTS|AWARDS|ACTIVITIES|HONORS)\s+/gi, "\n\n$1\n");
}

function unescapePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}
