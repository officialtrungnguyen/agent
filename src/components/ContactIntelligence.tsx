import { useMemo, useState } from "react";
import type { Contact, ResumeData, UserProfile } from "../types";
import { Drawer } from "./ui/Drawer";
import { Button } from "./ui/Button";
import { Pill } from "./ui/Pill";
import { FitScore } from "./FitScore";
import { StatusBadge } from "./StatusBadge";
import { generateIntel } from "../lib/ai/intel";
import { scoreContact } from "../lib/ai/scoring";
import { linkedinSearchUrl, googleSearchUrl, googleNewsUrl } from "../lib/linkedin";
import {
  Linkedin, ExternalLink, Newspaper, Copy, MailPlus, Check,
  Star, MessageSquarePlus, Clock,
} from "lucide-react";

interface Props {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  resume: ResumeData | null;
  profile: UserProfile;
  onCompose: (c: Contact, presetVariant?: "short" | "relationship" | "deal" | "aggressive") => void;
  onAddNote: (id: string, note: string) => void;
  onUpdateContact: (id: string, patch: Partial<Contact>) => void;
}

export function ContactIntelligence({
  contact, open, onClose, resume, profile, onCompose, onAddNote, onUpdateContact,
}: Props) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const intel = useMemo(() => (contact ? generateIntel(contact, resume) : null), [contact, resume]);
  const scoring = useMemo(() => (contact ? scoreContact(contact, resume, profile) : null), [contact, resume, profile]);

  if (!contact) return null;

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="720px"
      title={`${contact.firstName} ${contact.lastName}`}
      subtitle={`${contact.title} · ${contact.firm}`}
      footer={
        <>
          <a className="btn btn-ghost" href={linkedinSearchUrl(contact)} target="_blank" rel="noreferrer">
            <Linkedin size={12} /> LinkedIn
          </a>
          <a className="btn btn-ghost" href={googleSearchUrl(contact)} target="_blank" rel="noreferrer">
            <ExternalLink size={12} /> Google
          </a>
          <a className="btn btn-ghost" href={googleNewsUrl(contact)} target="_blank" rel="noreferrer">
            <Newspaper size={12} /> News
          </a>
          <Button variant="primary" leading={<MailPlus size={12} />} onClick={() => onCompose(contact)}>
            Compose Best Email
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-sharp bg-graphite-900 text-graphite-50 grid place-items-center font-mono font-semibold text-sm">
            {contact.firstName[0]}{contact.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Pill tone="ink">{contact.firmGroup}</Pill>
              <Pill tone="neutral">{contact.seniority}</Pill>
              {contact.school && <Pill tone="neutral">{contact.school}</Pill>}
              <Pill tone="neutral">{contact.city}</Pill>
              <StatusBadge contact={contact} />
            </div>
            <div className="mt-2 text-[12.5px] text-graphite-700">{intel?.summary}</div>
          </div>
          <div className="text-center">
            <div className="micro mb-1">// FIT</div>
            <FitScore score={scoring?.score} />
          </div>
        </section>

        <Section title="// FIT REASONING">
          <ul className="space-y-1 text-[12px] text-graphite-700">
            {scoring?.reasons.map((r) => <li key={r}>· {r}</li>)}
            {!scoring?.reasons.length && <li className="text-graphite-500">Upload your resume to unlock personalized fit scoring.</li>}
          </ul>
        </Section>

        <Section title="// TEAM & DESK">
          <div className="grid grid-cols-2 gap-2">
            {intel?.deskMetrics.map((m) => (
              <div key={m.label} className="hairline rounded-sharp px-2.5 py-1.5">
                <div className="micro">{m.label}</div>
                <div className="text-[12.5px] text-graphite-900 mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="// RECENT TRANSACTIONS">
          <ul className="space-y-1.5">
            {(contact.recentDeals || []).map((d, i) => (
              <li key={i} className="hairline rounded-sharp p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] text-graphite-900">{d.title}</span>
                  <Pill tone="neutral">{d.value}</Pill>
                </div>
                <div className="micro mt-1">{d.date} {d.sector ? `· ${d.sector}` : ""}</div>
              </li>
            ))}
            {!(contact.recentDeals || []).length && <li className="text-[12px] text-graphite-500">No recent transactions on file.</li>}
          </ul>
        </Section>

        <Section title="// TEAM MOVES & MOMENTUM">
          <ul className="space-y-1 text-[12px] text-graphite-700">
            {intel?.teamMoves.map((t, i) => <li key={i}>· {t}</li>)}
            {!intel?.teamMoves.length && <li className="text-graphite-500">No team-level signals on file.</li>}
          </ul>
        </Section>

        <Section title="// SHARED ALUMNI / INTERESTS">
          <ul className="space-y-1 text-[12px] text-graphite-700">
            {intel?.sharedAlumniInterests.map((t, i) => <li key={i}>· {t}</li>)}
          </ul>
        </Section>

        <Section title="// ICEBREAKERS — TAP TO COPY">
          <ul className="space-y-1.5">
            {intel?.icebreakers.map((ib, i) => (
              <li key={i} className="flex items-start gap-2 hairline rounded-sharp p-2.5">
                <span className="flex-1 text-[12.5px] text-graphite-900">{ib}</span>
                <button
                  onClick={() => copy(ib, `ib-${i}`)}
                  className="btn btn-ghost h-6 px-1.5 shrink-0"
                  title="Copy"
                >
                  {copied === `ib-${i}` ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="// SHARP QUESTIONS FOR THE CALL">
          <ul className="space-y-1 text-[12px] text-graphite-700">
            {intel?.questions.map((q, i) => <li key={i}>· {q}</li>)}
          </ul>
        </Section>

        <Section title="// PERSONAL STYLE">
          <div className="text-[12.5px] text-graphite-700">{contact.personalStyle}</div>
        </Section>

        <Section title="// COMPOSE — PICK A VARIANT">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" leading={<MailPlus size={12} />} onClick={() => onCompose(contact, "short")}>Short & Direct</Button>
            <Button variant="ghost" leading={<MailPlus size={12} />} onClick={() => onCompose(contact, "relationship")}>Relationship-First</Button>
            <Button variant="ghost" leading={<MailPlus size={12} />} onClick={() => onCompose(contact, "deal")}>Deal-Referenced</Button>
            <Button variant="ghost" leading={<MailPlus size={12} />} onClick={() => onCompose(contact, "aggressive")}>Aggressive / High-Conviction</Button>
          </div>
        </Section>

        <Section title="// RELATIONSHIP STRENGTH">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => onUpdateContact(contact.id, { relationshipStars: i as 1 | 2 | 3 | 4 | 5 })}
              >
                <Star
                  size={14}
                  className={i <= (contact.relationshipStars || 0) ? "fill-amber-400 text-amber-400" : "text-graphite-300"}
                />
              </button>
            ))}
            <span className="micro ml-2">{contact.relationshipStars || 0}/5</span>
            {contact.lastReplyAt && (
              <span className="micro ml-3 inline-flex items-center gap-1"><Clock size={10} /> last reply {new Date(contact.lastReplyAt).toLocaleDateString()}</span>
            )}
          </div>
        </Section>

        <Section title="// NOTES">
          {contact.notes && (
            <pre className="text-[12px] text-graphite-700 whitespace-pre-wrap hairline rounded-sharp p-2.5 bg-graphite-50">{contact.notes}</pre>
          )}
          <div className="flex items-center gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Add a quick note..." />
            <Button
              variant="ghost"
              leading={<MessageSquarePlus size={12} />}
              onClick={() => {
                if (!note.trim()) return;
                onAddNote(contact.id, note.trim());
                setNote("");
              }}
            >
              Add note
            </Button>
          </div>
        </Section>

        {intel?.warnings.length ? (
          <Section title="// WARNINGS">
            <ul className="space-y-1 text-[12px] text-amber-800">
              {intel.warnings.map((w, i) => <li key={i}>· {w}</li>)}
            </ul>
          </Section>
        ) : null}
      </div>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="micro-strong">{title}</div>
      <div>{children}</div>
    </section>
  );
}
