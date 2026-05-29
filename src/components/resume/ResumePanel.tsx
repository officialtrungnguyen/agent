"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAppStore } from "@/store/useAppStore";
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  Brain,
  GraduationCap,
  Briefcase,
  Zap,
  Edit2,
  Save,
  X,
  RefreshCw,
  Award,
  Target,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ResumeData } from "@/types";

export function ResumePanel() {
  const { resume, setResume } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [editingPitch, setEditingPitch] = useState(false);
  const [pitchDraft, setPitchDraft] = useState(resume?.personalPitch || "");
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState(resume?.targetRole || "");

  const processFile = async (file: File) => {
    setUploading(true);
    try {
      let text = "";

      if (file.type === "application/pdf") {
        text = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            // For PDF, we extract raw text (basic)
            const result = reader.result as string;
            // Strip binary and get printable chars
            const cleaned = result
              .replace(/[^\x20-\x7E\n]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            resolve(cleaned || `[PDF: ${file.name}] Unable to extract text directly. Please paste resume text.`);
          };
          reader.readAsText(file, "latin1");
        });
      } else {
        text = await file.text();
      }

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName: file.name }),
      });

      if (!res.ok) throw new Error("Parse failed");
      const parsed: ResumeData = await res.json();
      setResume(parsed);
      toast.success("Resume parsed and stored. AI is now personalized to your background.");
    } catch (err) {
      toast.error("Failed to parse resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) processFile(file);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleSavePitch = () => {
    if (resume) {
      setResume({ ...resume, personalPitch: pitchDraft });
      toast.success("Personal pitch updated");
    }
    setEditingPitch(false);
  };

  const handleSaveRole = () => {
    if (resume) {
      setResume({ ...resume, targetRole: roleDraft });
      toast.success("Target role updated");
    }
    setEditingRole(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Upload Panel */}
      <div className="w-72 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="micro-label mb-3">Resume Upload</div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-indigo-500 bg-indigo-600/10"
                : "border-border hover:border-indigo-500/50 hover:bg-accent/30"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
                <div className="text-xs text-indigo-400">AI parsing your resume...</div>
              </div>
            ) : resume ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <div className="text-xs text-emerald-400 font-medium">Resume loaded</div>
                <div className="text-[11px] text-muted-foreground">{resume.fileName}</div>
                <div className="text-[10px] text-muted-foreground">Drop to replace</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-xs text-foreground">Drop resume here</div>
                <div className="text-[10px] text-muted-foreground">PDF, DOC, or TXT · Max 5MB</div>
              </div>
            )}
          </div>

          {resume && (
            <button
              onClick={() => setResume(null)}
              className="btn-ghost text-xs w-full mt-3 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Resume
            </button>
          )}
        </div>

        {/* Target Settings */}
        {resume && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div>
              <div className="micro-label mb-2">Target Role</div>
              {editingRole ? (
                <div className="flex gap-2">
                  <input
                    value={roleDraft}
                    onChange={(e) => setRoleDraft(e.target.value)}
                    className="input-base text-xs flex-1"
                    autoFocus
                  />
                  <button onClick={handleSaveRole} className="p-1.5 text-emerald-400 hover:text-emerald-300">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingRole(false)} className="p-1.5 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <span className="text-xs text-foreground">{resume.targetRole}</span>
                  <button
                    onClick={() => { setRoleDraft(resume.targetRole); setEditingRole(true); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="micro-label mb-2">Target Sectors</div>
              <div className="flex flex-wrap gap-1.5">
                {(resume.targetSectors || []).map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 font-mono">
                    {s}
                  </span>
                ))}
                {(!resume.targetSectors || resume.targetSectors.length === 0) && (
                  <span className="text-[11px] text-muted-foreground">None specified</span>
                )}
              </div>
            </div>

            <div>
              <div className="micro-label mb-2">Target Firms</div>
              <div className="flex flex-wrap gap-1.5">
                {(resume.targetFirms || []).map((f) => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border font-mono">
                    {f}
                  </span>
                ))}
                {(!resume.targetFirms || resume.targetFirms.length === 0) && (
                  <span className="text-[11px] text-muted-foreground">None specified</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resume Content */}
      <div className="flex-1 overflow-y-auto">
        {!resume ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <div className="text-sm font-medium">Upload your resume to unlock AI personalization</div>
            <div className="text-xs mt-2 opacity-60 text-center max-w-sm">
              The AI will parse your resume and use it to generate hyper-personalized
              outreach emails tailored to each banker's background and deals.
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600/30 to-blue-600/30 border-2 border-emerald-600/20 flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">{resume.name}</div>
                <div className="text-xs text-muted-foreground">{resume.email} · {resume.phone}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />
                AI PARSED
              </div>
            </div>

            {/* Personal Pitch */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="micro-label">Personal Pitch</div>
                <button
                  onClick={() => { setPitchDraft(resume.personalPitch); setEditingPitch(true); }}
                  className="btn-ghost text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
              {editingPitch ? (
                <div className="space-y-2">
                  <textarea
                    value={pitchDraft}
                    onChange={(e) => setPitchDraft(e.target.value)}
                    className="input-base w-full h-24 resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSavePitch} className="btn-primary text-xs">
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setEditingPitch(false)} className="btn-ghost text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card-base p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resume.personalPitch}
                  </p>
                </div>
              )}
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <div className="micro-label">Education</div>
              </div>
              <div className="space-y-3">
                {resume.education?.map((edu, i) => (
                  <div key={i} className="card-base p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">{edu.institution}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {edu.degree} in {edu.field}
                        </div>
                        {edu.gpa && (
                          <div className="text-xs font-mono text-emerald-400 mt-1">GPA: {edu.gpa}</div>
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{edu.graduationYear}</span>
                    </div>
                    {edu.honors && edu.honors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {edu.honors.map((h) => (
                          <span key={h} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <div className="micro-label">Experience</div>
              </div>
              <div className="space-y-3">
                {resume.experience?.map((exp, i) => (
                  <div key={i} className="card-base p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-foreground">{exp.title}</div>
                        <div className="text-xs text-muted-foreground">{exp.company}</div>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {exp.startDate} — {exp.endDate}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {exp.bullets?.map((bullet, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">·</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {(!resume.experience || resume.experience.length === 0) && (
                  <div className="card-base p-6 text-center text-sm text-muted-foreground">
                    No experience entries parsed. Edit your pitch above to highlight key experience.
                  </div>
                )}
              </div>
            </div>

            {/* Achievements */}
            {resume.achievements && resume.achievements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <div className="micro-label">Key Achievements</div>
                </div>
                <div className="card-base p-4 space-y-2">
                  {resume.achievements.map((achievement, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {resume.skills && resume.skills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <div className="micro-label">Skills</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-md bg-secondary border border-border text-muted-foreground font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
