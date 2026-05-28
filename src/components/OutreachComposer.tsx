import { useEffect, useState } from "react";
import { Sparkles, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input, Label, Textarea } from "./ui/input";
import type { Contact, EmailVariant, QueueItem, ResumeData } from "@/types";
import {
  generateEmailVariants,
  generateSubjectLines,
} from "@/data/offlineAI";
import { loadQueue, saveQueue } from "@/lib/storage";
import { v4 as uuid } from "uuid";

interface Props {
  contact: Contact;
  resume: ResumeData | null;
  onQueued: (subject: string, body: string) => void;
}

export function OutreachComposer({ contact, resume, onQueued }: Props) {
  const [variants, setVariants] = useState<EmailVariant[]>([]);
  const [selected, setSelected] = useState(0);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [attachResume, setAttachResume] = useState(false);

  useEffect(() => {
    const v = generateEmailVariants(contact, resume);
    setVariants(v);
    setSelected(0);
    if (v[0]) {
      setSubject(v[0].subject);
      setBody(v[0].body);
    }
    setSubjects(generateSubjectLines(contact, resume));
  }, [contact, resume]);

  const selectVariant = (idx: number) => {
    setSelected(idx);
    const v = variants[idx];
    if (v) {
      setSubject(v.subject);
      setBody(v.body);
    }
  };

  const queueEmail = () => {
    const item: QueueItem = {
      id: uuid(),
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      subject,
      body,
      status: "queued",
      attachResume,
      tailoredResume: attachResume
        ? resume
          ? `Tailored for ${contact.team}: ${resume.achievements.slice(0, 2).join("; ")}`
          : undefined
        : undefined,
    };
    const q = loadQueue();
    saveQueue([...q, item]);
    onQueued(subject, body);
  };

  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
            Outreach Composer
          </span>
          <Button
            size="sm"
            onClick={() => {
              const v = generateEmailVariants(contact, resume);
              setVariants(v);
              if (v[0]) {
                setSubject(v[0].subject);
                setBody(v[0].body);
              }
            }}
          >
            <Sparkles className="h-4 w-4" />
            Generate Best Email
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {variants.map((v, i) => (
            <Button
              key={v.id}
              size="sm"
              variant={selected === i ? "default" : "outline"}
              onClick={() => selectVariant(i)}
            >
              {v.label}
            </Button>
          ))}
        </div>

        <div>
          <Label>A/B Subject Lines</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {subjects.map((s, i) => (
              <Button
                key={i}
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setSubject(s)}
              >
                {s.slice(0, 40)}…
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label>
            Body{" "}
            <span
              className={
                wordCount > 150 ? "text-amber-600" : "text-graphite-400"
              }
            >
              ({wordCount} words — target &lt;150)
            </span>
          </Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="font-mono text-xs"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={attachResume}
            onChange={(e) => setAttachResume(e.target.checked)}
          />
          <Paperclip className="h-4 w-4" />
          Attach tailored resume / one-pager
        </label>

        <Button className="w-full" onClick={queueEmail}>
          Add to Queue
        </Button>
      </CardContent>
    </Card>
  );
}
