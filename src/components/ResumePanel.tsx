import { Download, FileUp, Sparkles, Target } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { buildTailoredBullets } from '../lib/recruiting';
import type { Contact, ResumeProfile } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface ResumePanelProps {
  resume: ResumeProfile;
  selectedContact?: Contact;
  onUploadResume: (file: File) => Promise<void>;
  onUpdateResume: (patch: Partial<ResumeProfile>) => void;
  onStoreTailoredBullets: (contactId: string, bullets: string[]) => void;
  onDownloadTailored: (contact: Contact, bullets: string[]) => void;
}

export function ResumePanel({
  resume,
  selectedContact,
  onUploadResume,
  onUpdateResume,
  onStoreTailoredBullets,
  onDownloadTailored,
}: ResumePanelProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    onDropAccepted: async (files) => {
      const [file] = files;
      if (file) {
        await onUploadResume(file);
      }
    },
  });

  const tailoredBullets = selectedContact
    ? resume.tailoredBullets[selectedContact.id] ?? buildTailoredBullets(selectedContact, resume)
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="micro-label">Resume Intelligence</div>
        <CardTitle className="mt-2 text-xl">Upload once, tailor endlessly</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`rounded-xl border border-dashed p-5 transition ${
            isDragActive ? 'border-slate-400 bg-slate-900/70' : 'border-slate-700 bg-slate-950/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-slate-700 p-2">
              <FileUp className="h-4 w-4 text-slate-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Drag a PDF or text resume here</div>
              <div className="mt-1 text-sm text-slate-400">
                The parser extracts education, quantified achievements, experience, and skill keywords for targeting and drafting.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Target role</label>
            <Input value={resume.targetRole} onChange={(event) => onUpdateResume({ targetRole: event.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Uploaded file</label>
            <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
              {resume.fileName ?? 'No file uploaded yet'}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Personal pitch</label>
          <Textarea value={resume.pitch} onChange={(event) => onUpdateResume({ pitch: event.target.value })} className="min-h-[100px]" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniList title="Education" items={resume.education} />
          <MiniList title="Achievements" items={resume.achievements} accent="green" />
          <MiniList title="Experience" items={resume.experience} accent="blue" />
          <MiniList title="Skills" items={resume.skills} accent="amber" />
        </div>

        {selectedContact ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="micro-label">Tailored one-pager</div>
                <div className="mt-2 text-sm text-slate-100">
                  {selectedContact.firstName} {selectedContact.lastName} - {selectedContact.firm} {selectedContact.team}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStoreTailoredBullets(selectedContact.id, buildTailoredBullets(selectedContact, resume))}
                >
                  <Sparkles className="h-4 w-4" /> Refresh bullets
                </Button>
                <Button size="sm" onClick={() => onDownloadTailored(selectedContact, tailoredBullets)}>
                  <Download className="h-4 w-4" /> Download tailored note
                </Button>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {tailoredBullets.map((bullet) => (
                <div key={bullet} className="rounded-lg border border-slate-800 p-3 text-sm text-slate-300">
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 px-4 py-5 text-sm text-slate-400">
            Pick a banker to generate custom bullets and attach a tailored one-pager.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniList({ title, items, accent = 'slate' }: { title: string; items: string[]; accent?: 'slate' | 'green' | 'blue' | 'amber' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="micro-label">{title}</div>
        <Badge variant={accent}>{items.length}</Badge>
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        {items.length ? items.slice(0, 5).map((item) => <div key={item}>- {item}</div>) : <div className="text-slate-500">No parsed content yet.</div>}
      </div>
    </div>
  );
}
