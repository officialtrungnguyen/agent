"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Check,
  Trash2,
  Plus,
  X,
  Wand2,
  Target,
  ClipboardPaste,
  Copy,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { ResumeProfile } from "@/types";
import { Button, Card, Input, MicroLabel, Badge, Textarea, Select } from "@/components/ui";
import { parseResume, emptyResume, extractPdfText } from "@/lib/resume";
import { fullName } from "@/lib/utils";

export function ResumePanel() {
  const { resume, saveResume, contacts } = useStore();
  const [draft, setDraft] = useState<ResumeProfile>(resume ?? emptyResume());
  const [dragOver, setDragOver] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saved, setSaved] = useState(false);
  const [tailorId, setTailorId] = useState("");
  const [tailored, setTailored] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<ResumeProfile>) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  const persist = (next: ResumeProfile) => {
    saveResume(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleFile = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      const buf = new Uint8Array(await file.arrayBuffer());
      const text = extractPdfText(buf);
      const dataUrl = await fileToDataUrl(file);
      const parsed = parseResume(text || "", file.name, dataUrl);
      const merged = { ...parsed, fileDataUrl: dataUrl, fileName: file.name };
      setDraft(merged);
      persist(merged);
      if (!text) {
        setPasteOpen(true); // PDF had no extractable text — prompt paste.
      }
    } else {
      const text = await file.text();
      const dataUrl = await fileToDataUrl(file);
      const parsed = parseResume(text, file.name, dataUrl);
      setDraft(parsed);
      persist(parsed);
    }
  };

  const applyPaste = () => {
    const parsed = parseResume(pasteText, draft.fileName, draft.fileDataUrl);
    const merged = { ...parsed, fileDataUrl: draft.fileDataUrl, fileName: draft.fileName };
    setDraft(merged);
    persist(merged);
    setPasteOpen(false);
  };

  const tailorBullets = () => {
    const c = contacts.find((x) => x.id === tailorId);
    if (!c) return;
    const sectors = c.coverage;
    const deal = c.recentDeals[0];
    const base = draft.achievements.length
      ? draft.achievements
      : [
          "Built a 3-statement model and DCF to value a target across multiple scenarios",
          "Led diligence on a sector deal, synthesizing findings into a partner-ready memo",
          "Analyzed comparable companies and precedent transactions for a live mandate",
        ];
    const out = base.slice(0, 3).map((b) =>
      `${b} — directly relevant to ${c.firm}'s ${sectors[0]} coverage${deal ? ` (cf. the ${deal.company} ${deal.type.toLowerCase()})` : ""}.`,
    );
    out.push(
      `Positioning line: "My ${draft.major || "finance"} background and ${sectors[0]} interest map cleanly onto your ${c.team} mandate."`,
    );
    setTailored(out);
  };

  const hasResume = !!draft.rawText || !!draft.name;

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left: upload + structured fields */}
        <div className="space-y-4">
          {/* Upload zone */}
          <Card className="p-0">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? "border-slate-900 bg-slate-50" : "border-slate-200"
              }`}
            >
              <Upload size={22} className="text-slate-400" />
              <div className="text-sm font-medium text-slate-700">Drag &amp; drop your resume (PDF or text)</div>
              <div className="text-xs text-slate-400">The AI parses achievements, skills, and education automatically.</div>
              <div className="mt-2 flex gap-2">
                <Button variant="primary" size="sm" onClick={() => fileRef.current?.click()}>
                  <FileText size={14} /> Choose file
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
                  <ClipboardPaste size={14} /> Paste text
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,text/plain,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
            {draft.fileName && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs">
                <span className="flex items-center gap-2 text-slate-600"><FileText size={14} /> {draft.fileName}</span>
                <span className="flex items-center gap-3">
                  {draft.fileDataUrl && <Badge tone="green"><Check size={10} /> Ready to attach</Badge>}
                  <button onClick={() => { const next = { ...draft, fileName: undefined, fileDataUrl: undefined }; setDraft(next); persist(next); }} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                </span>
              </div>
            )}
          </Card>

          {pasteOpen && (
            <Card className="p-4 animate-fade-in">
              <MicroLabel className="mb-1.5">Paste resume text</MicroLabel>
              <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={8} placeholder="Paste the full text of your resume here…" />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPasteOpen(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={applyPaste} disabled={!pasteText.trim()}><Wand2 size={14} /> Parse</Button>
              </div>
            </Card>
          )}

          {/* Structured fields */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <MicroLabel>Parsed Profile</MicroLabel>
              {saved && <Badge tone="green"><Check size={10} /> Saved</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" value={draft.name} onChange={(v) => update({ name: v })} />
              <Field label="Email" value={draft.email} onChange={(v) => update({ email: v })} />
              <Field label="Phone" value={draft.phone} onChange={(v) => update({ phone: v })} />
              <Field label="School" value={draft.school} onChange={(v) => update({ school: v })} />
              <Field label="Grad year" value={draft.gradYear} onChange={(v) => update({ gradYear: v })} />
              <Field label="GPA" value={draft.gpa} onChange={(v) => update({ gpa: v })} />
              <Field label="Major" value={draft.major} onChange={(v) => update({ major: v })} />
              <Field label="Target role" value={draft.targetRole} onChange={(v) => update({ targetRole: v })} />
            </div>
            <div className="mt-3">
              <MicroLabel className="mb-1">Target firms (comma-separated)</MicroLabel>
              <Input
                value={draft.targetFirms.join(", ")}
                onChange={(e) => update({ targetFirms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Houlihan Lokey, Moelis, Evercore…"
              />
            </div>
            <div className="mt-3">
              <MicroLabel className="mb-1">Personal pitch</MicroLabel>
              <Textarea
                value={draft.personalPitch}
                onChange={(e) => update({ personalPitch: e.target.value })}
                rows={2}
                placeholder="One or two lines on why IB, your edge, and your target group."
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => persist(draft)}><Check size={14} /> Save Profile</Button>
            </div>
          </Card>

          {/* Skills + achievements */}
          <Card className="p-4">
            <MicroLabel className="mb-2">Skills</MicroLabel>
            <ChipEditor items={draft.skills} onChange={(skills) => { update({ skills }); }} placeholder="Add a skill" />
            <div className="mt-4">
              <MicroLabel className="mb-2">Achievements / Bullets</MicroLabel>
              <ListEditor items={draft.achievements} onChange={(achievements) => update({ achievements })} />
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => persist(draft)}><Check size={14} /> Save</Button>
            </div>
          </Card>
        </div>

        {/* Right: tailoring + summary */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Target size={14} className="text-slate-900" />
              <MicroLabel>Tailor Bullets for a Banker</MicroLabel>
            </div>
            <Select value={tailorId} onChange={(e) => setTailorId(e.target.value)} className="w-full">
              <option value="">Select a contact…</option>
              {contacts.slice(0, 120).map((c) => (
                <option key={c.id} value={c.id}>{fullName(c)} — {c.firm} ({c.coverage[0]})</option>
              ))}
            </Select>
            <Button variant="primary" size="sm" className="mt-2 w-full" onClick={tailorBullets} disabled={!tailorId}>
              <Wand2 size={14} /> Generate tailored bullets
            </Button>
            {tailored.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {tailored.map((t, i) => (
                  <div key={i} className="group flex items-start gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs leading-relaxed text-slate-700">
                    <span className="flex-1">{t}</span>
                    <button onClick={() => navigator.clipboard?.writeText(t)} className="text-slate-400 hover:text-slate-700"><Copy size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <MicroLabel className="mb-2">Profile Strength</MicroLabel>
            <StrengthMeter resume={draft} />
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              <Hint ok={!!draft.name} text="Name detected" />
              <Hint ok={!!draft.school} text="School detected" />
              <Hint ok={draft.skills.length > 0} text="Skills extracted" />
              <Hint ok={draft.achievements.length > 0} text="Achievements extracted" />
              <Hint ok={!!draft.fileDataUrl} text="Original file ready to attach" />
              <Hint ok={draft.targetFirms.length > 0} text="Target firms set" />
            </ul>
          </Card>

          {!hasResume && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              Upload your resume once and every email, fit score, and tailored bullet across the app becomes personalized to you.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <MicroLabel className="mb-1">{label}</MicroLabel>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ChipEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span key={i} className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
            {s}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); } }} placeholder={placeholder} className="h-8" />
        <Button variant="outline" size="sm" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}><Plus size={14} /></Button>
      </div>
    </div>
  );
}

function ListEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-1.5">
      {items.map((s, i) => (
        <div key={i} className="flex items-start gap-2 rounded border border-slate-200 p-2 text-xs">
          <span className="flex-1 text-slate-700">{s}</span>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X size={13} /></button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); } }} placeholder="Add an achievement…" className="h-8" />
        <Button variant="outline" size="sm" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}><Plus size={14} /></Button>
      </div>
    </div>
  );
}

function StrengthMeter({ resume }: { resume: ResumeProfile }) {
  const checks = [!!resume.name, !!resume.school, resume.skills.length > 0, resume.achievements.length > 0, !!resume.fileDataUrl, resume.targetFirms.length > 0, !!resume.targetRole, !!resume.personalPitch];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">Completeness</span>
        <span className="font-semibold text-slate-900">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Hint({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <Check size={12} className={ok ? "text-green-600" : "text-slate-300"} />
      <span className={ok ? "text-slate-600" : "text-slate-400"}>{text}</span>
    </li>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
