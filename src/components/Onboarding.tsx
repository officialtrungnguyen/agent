import * as React from "react";
import { ArrowRight, UploadCloud, Target, Sparkles, FileText, Check } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Input";
import { useApp } from "../store/AppContext";
import { useToast } from "./ui/Toast";
import { parseResumeText } from "../lib/ai";
import { cn } from "../lib/utils";

export function Onboarding() {
  const { onboarded, setOnboarded, user, setUser, setResume } = useApp();
  const toast = useToast();
  const [step, setStep] = React.useState(0);
  const [hasResume, setHasResume] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (onboarded) return null;

  const handleFile = async (file: File) => {
    let text = "";
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      try { sessionStorage.setItem("bb_resume_b64", btoa(bin)); } catch { /* ignore */ }
      text = bin.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s{3,}/g, "\n");
    } else {
      text = await file.text();
    }
    const parsed = parseResumeText(text, file.name);
    setResume(parsed);
    setUser({
      ...user,
      fullName: user.fullName || parsed.name || "",
      email: user.email || parsed.email || "",
      school: parsed.education[0]?.school || user.school,
    });
    setHasResume(true);
    toast.push("Résumé parsed — your AI coach is calibrated.", "success");
  };

  const finish = () => {
    setOnboarded(true);
    toast.push("Welcome to BulgeBracket.ai. Let's land you an offer.", "success");
  };

  return (
    <Dialog open={!onboarded} onClose={() => undefined} size="md">
      <div className="px-6 py-6">
        {/* Brand */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-graphite-900 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-graphite-900">BulgeBracket.ai</h2>
            <p className="text-xs text-graphite-500">Your IB recruiting command center</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2].map((s) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", s <= step ? "bg-graphite-900" : "bg-graphite-200")} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-5 w-5 text-graphite-400" />
              <div>
                <h3 className="text-base font-semibold text-graphite-900">Tell us your target</h3>
                <p className="text-sm text-graphite-500">We'll score 240+ alumni bankers against your goals.</p>
              </div>
            </div>
            <label className="block">
              <span className="micro-label">Your name</span>
              <Input className="mt-1" value={user.fullName} onChange={(e) => setUser({ ...user, fullName: e.target.value })} placeholder="Alex Morgan" />
            </label>
            <label className="block">
              <span className="micro-label">Your school</span>
              <Input className="mt-1" value={user.school} onChange={(e) => setUser({ ...user, school: e.target.value })} />
            </label>
            <label className="block">
              <span className="micro-label">Target role</span>
              <Input className="mt-1" value={user.targetRole} onChange={(e) => setUser({ ...user, targetRole: e.target.value })} />
            </label>
            <Button className="w-full" onClick={() => setStep(1)}>Continue <ArrowRight className="h-4 w-4" /></Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-graphite-400" />
              <div>
                <h3 className="text-base font-semibold text-graphite-900">Upload your résumé</h3>
                <p className="text-sm text-graphite-500">Powers hyper-personalized emails and fit scoring. Optional — you can add it later.</p>
              </div>
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-graphite-300 px-4 py-8 text-center hover:border-graphite-400 hover:bg-graphite-50"
            >
              {hasResume ? (
                <>
                  <Check className="mb-2 h-7 w-7 text-emerald-600" />
                  <p className="text-sm font-medium text-graphite-700">Résumé added — nicely done</p>
                </>
              ) : (
                <>
                  <UploadCloud className="mb-2 h-7 w-7 text-graphite-400" />
                  <p className="text-sm font-medium text-graphite-700">Click to upload (PDF or .txt)</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
            </div>
            <label className="block">
              <span className="micro-label">Personal pitch (one line)</span>
              <Textarea rows={2} className="mt-1" value={user.personalPitch} onChange={(e) => setUser({ ...user, personalPitch: e.target.value })} />
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Skip for now</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-graphite-400" />
              <div>
                <h3 className="text-base font-semibold text-graphite-900">You're ready</h3>
                <p className="text-sm text-graphite-500">Here's your unfair advantage:</p>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                "AI fit scores on 240+ elite alumni bankers",
                "Deep banker intel: deals, coverage, icebreakers",
                "Hyper-personalized emails in 4 proven variants",
                "Real Gmail send + optimal-time scheduling",
                "Auto 7-day follow-ups & full CRM tracking",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-graphite-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={finish}>Enter the command center <ArrowRight className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
