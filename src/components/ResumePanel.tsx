import * as React from "react";
import {
  UploadCloud, FileText, Trash2, GraduationCap, Briefcase, Wrench, Trophy,
  Wand2, Copy, Check, User, Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input, Textarea, Select } from "./ui/Input";
import { EmptyState } from "./ui/Misc";
import { useApp } from "../store/AppContext";
import { useToast } from "./ui/Toast";
import { cn, fmtDate } from "../lib/utils";
import { parseResumeText, tailorBulletsFor } from "../lib/ai";
import type { ResumeProfile } from "../types";

export function ResumePanel() {
  const { user, setUser, setResume, contacts } = useApp();
  const toast = useToast();
  const [dragging, setDragging] = React.useState(false);
  const [tailorContactId, setTailorContactId] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    let text = "";
    if (isPdf) {
      // Store base64 for real attachment; extract any embedded text heuristically.
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      try {
        sessionStorage.setItem("bb_resume_b64", btoa(bin));
      } catch {
        /* too large for sessionStorage — attachment falls back to text */
      }
      // Best-effort text scrape from the PDF stream (works for many simple PDFs).
      text = bin.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s{3,}/g, "\n");
    } else {
      text = await file.text();
      sessionStorage.removeItem("bb_resume_b64");
    }
    const parsed = parseResumeText(text, file.name);
    setResume(parsed);
    // Backfill user profile fields if empty.
    setUser({
      ...user,
      fullName: user.fullName || parsed.name || "",
      email: user.email || parsed.email || "",
      school: user.school || parsed.education[0]?.school || user.school,
    });
    toast.push("Résumé parsed and stored.", "success");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const resume = user.resume;
  const tailorContact = contacts.find((c) => c.id === tailorContactId);
  const tailored = tailorContact ? tailorBulletsFor(tailorContact, resume) : [];

  const copyTailored = () => {
    navigator.clipboard?.writeText(tailored.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.push("Tailored bullets copied.", "success");
    });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-5 p-5 lg:grid-cols-2">
      {/* Profile */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-graphite-400" /> Your Recruiting Profile</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={user.fullName} onChange={(e) => setUser({ ...user, fullName: e.target.value })} placeholder="Alex Morgan" />
          </Field>
          <Field label="Email">
            <Input value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} placeholder="you@school.edu" />
          </Field>
          <Field label="School">
            <Input value={user.school} onChange={(e) => setUser({ ...user, school: e.target.value })} />
          </Field>
          <Field label="Target role">
            <Input value={user.targetRole} onChange={(e) => setUser({ ...user, targetRole: e.target.value })} />
          </Field>
          <Field label="Graduation year">
            <Input type="number" value={user.gradYear ?? ""} onChange={(e) => setUser({ ...user, gradYear: Number(e.target.value) || undefined })} />
          </Field>
          <Field label="Email signature">
            <Input value={user.signature} onChange={(e) => setUser({ ...user, signature: e.target.value })} placeholder="Best,\nAlex Morgan" />
          </Field>
          <Field label="Personal pitch" full>
            <Textarea
              rows={2}
              value={user.personalPitch}
              onChange={(e) => setUser({ ...user, personalPitch: e.target.value })}
              placeholder="One or two lines on who you are and what you're targeting."
            />
          </Field>
        </CardBody>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-graphite-400" /> Résumé</CardTitle>
          {resume && (
            <Button size="sm" variant="ghost" onClick={() => { setResume(undefined); sessionStorage.removeItem("bb_resume_b64"); toast.push("Résumé removed.", "info"); }}>
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragging ? "border-graphite-900 bg-graphite-50" : "border-graphite-300 hover:border-graphite-400 hover:bg-graphite-50",
            )}
          >
            <UploadCloud className="mb-2 h-7 w-7 text-graphite-400" />
            <p className="text-sm font-medium text-graphite-700">Drop your résumé here</p>
            <p className="mt-0.5 text-xs text-graphite-400">PDF or .txt — parsed locally, never uploaded to a third party</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,text/plain,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
            />
          </div>
          {resume && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-graphite-200 bg-graphite-50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-graphite-500" />
                <span className="font-medium text-graphite-800">{resume.fileName || "résumé.txt"}</span>
              </div>
              <span className="text-xs text-graphite-400">Parsed {fmtDate(resume.uploadedAt)}</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tailor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-graphite-400" /> Tailor for a Banker</CardTitle>
        </CardHeader>
        <CardBody>
          <span className="micro-label">Target banker / desk</span>
          <Select value={tailorContactId} onChange={(e) => setTailorContactId(e.target.value)} className="mt-1.5 w-full">
            <option value="">Select a contact…</option>
            {contacts.slice(0, 80).map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.firm} ({c.division})</option>
            ))}
          </Select>
          {tailorContact ? (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="micro-label">Tailored bullets</span>
                <Button size="sm" variant="ghost" onClick={copyTailored}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy
                </Button>
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {tailored.map((b, i) => (
                  <li key={i} className="rounded-md border border-graphite-200 bg-white p-2 text-xs text-graphite-700">• {b}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs text-graphite-400">Pick a banker to auto-generate desk-specific bullet points from your achievements.</p>
          )}
        </CardBody>
      </Card>

      {/* Parsed structure */}
      {resume && <ParsedResume resume={resume} />}
    </div>
  );
}

function ParsedResume({ resume }: { resume: ResumeProfile }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-graphite-400" /> Parsed Résumé Intelligence</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-5 md:grid-cols-2">
        <Block icon={<GraduationCap className="h-4 w-4" />} title="Education">
          {resume.education.length ? (
            <ul className="space-y-1.5">
              {resume.education.map((e, i) => (
                <li key={i} className="text-sm text-graphite-700">
                  {e.school} {e.gradYear ? <span className="text-graphite-400">· {e.gradYear}</span> : null} {e.gpa ? <Badge tone="outline">GPA {e.gpa}</Badge> : null}
                </li>
              ))}
            </ul>
          ) : <Muted />}
        </Block>

        <Block icon={<Wrench className="h-4 w-4" />} title="Skills">
          {resume.skills.length ? (
            <div className="flex flex-wrap gap-1.5">{resume.skills.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
          ) : <Muted />}
        </Block>

        <Block icon={<Briefcase className="h-4 w-4" />} title="Experience">
          {resume.experience.length ? (
            <ul className="space-y-2.5">
              {resume.experience.map((x, i) => (
                <li key={i}>
                  <div className="text-sm font-medium text-graphite-800">{x.role} · {x.company}</div>
                  {x.bullets.slice(0, 2).map((b, j) => <p key={j} className="mt-0.5 text-xs text-graphite-500">• {b}</p>)}
                </li>
              ))}
            </ul>
          ) : <Muted />}
        </Block>

        <Block icon={<Trophy className="h-4 w-4" />} title="Key Achievements">
          {resume.achievements.length ? (
            <ul className="space-y-1">
              {resume.achievements.slice(0, 6).map((a, i) => <li key={i} className="text-xs text-graphite-600">• {a}</li>)}
            </ul>
          ) : <Muted />}
        </Block>
      </CardBody>
    </Card>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="micro-label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-graphite-400">{icon}</span>
        <h4 className="text-sm font-semibold text-graphite-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Muted() {
  return <p className="text-xs text-graphite-400">Not detected — try a text-based résumé for best parsing.</p>;
}

export { EmptyState };
