import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, NotebookPen, ShieldCheck } from "lucide-react";
import { contactsData } from "./contactsData";
import type { Contact, GmailAuthState, OutreachRecord, QueuedEmail, ResumeProfile, OutreachStatus } from "./types";
import { getDefaultResume } from "./lib/intelligence";
import { storage } from "./lib/storage";
import { uid } from "./lib/utils";
import { AlumniLedger } from "./components/AlumniLedger";
import { Analytics } from "./components/Analytics";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { GmailScheduler } from "./components/GmailScheduler";
import { OutreachComposer } from "./components/OutreachComposer";
import { ResumePanel } from "./components/ResumePanel";
import { StrategyAdvisor } from "./components/StrategyAdvisor";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardHeader } from "./components/ui/Card";
import { Select, Textarea } from "./components/ui/Form";

const contactsKey = "bb.contacts.v1";

function loadContacts() {
  try {
    const saved = localStorage.getItem(contactsKey);
    return saved ? (JSON.parse(saved) as Contact[]) : contactsData;
  } catch {
    return contactsData;
  }
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [selectedId, setSelectedId] = useState(contacts[0]?.id);
  const [resume, setResume] = useState<ResumeProfile>(() => storage.getResume() ?? getDefaultResume());
  const [queue, setQueue] = useState<QueuedEmail[]>(() => storage.getQueue());
  const [records, setRecords] = useState<OutreachRecord[]>(() => storage.getOutreach());
  const [auth, setAuth] = useState<GmailAuthState>(() => storage.getAuth());
  const [query, setQuery] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [kanban, setKanban] = useState(false);
  const [note, setNote] = useState("");

  const selectedContact = contacts.find((contact) => contact.id === selectedId);
  const contactsById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);

  useEffect(() => storage.setResume(resume), [resume]);
  useEffect(() => storage.setQueue(queue), [queue]);
  useEffect(() => storage.setOutreach(records), [records]);
  useEffect(() => storage.setAuth(auth), [auth]);
  useEffect(() => localStorage.setItem(contactsKey, JSON.stringify(contacts)), [contacts]);

  function updateContact(id: string, patch: Partial<Contact>) {
    setContacts((current) => current.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact)));
  }

  function recordManualStatus(status: OutreachStatus) {
    if (!selectedContact) return;
    const record: OutreachRecord = {
      id: uid("manual"),
      contactId: selectedContact.id,
      subject: `Manual ${status} update`,
      body: "Manual CRM response tracker update.",
      variant: "Short",
      status,
      sentAt: new Date().toISOString(),
      hook: "Manual response tracker"
    };
    setRecords((current) => [record, ...current]);
    updateContact(selectedContact.id, { status, lastInteraction: new Date().toISOString() });
  }

  function addNote() {
    if (!selectedContact || !note.trim()) return;
    updateContact(selectedContact.id, {
      notes: [`${new Date().toLocaleDateString()}: ${note.trim()}`, ...selectedContact.notes],
      lastInteraction: new Date().toISOString()
    });
    setNote("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-5 px-4 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="micro-label">BulgeBracket.ai</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Investment Banking Recruiting AI
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                A live command center for alumni targeting, resume-aware banker research, personalized outreach,
                Gmail execution, scheduling, follow-ups, and pipeline analytics.
              </p>
            </div>
            <div className="grid gap-2 text-right">
              <Badge tone="green">
                <ShieldCheck className="h-3 w-3" /> Offline intelligence ready
              </Badge>
              <Badge tone="blue">Real Gmail REST API enabled</Badge>
              <Badge>Exact LinkedIn URLs only</Badge>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Contacts" value={contacts.length} />
            <Stat label="Queued" value={queue.length} />
            <Stat label="Outreach records" value={records.length} />
            <Stat label="Target role" value={resume.targetRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(420px,0.9fr)] lg:px-8">
        <section className="space-y-5">
          <AlumniLedger
            contacts={contacts}
            selectedId={selectedId}
            resume={resume}
            records={records}
            query={query}
            setQuery={setQuery}
            firmFilter={firmFilter}
            setFirmFilter={setFirmFilter}
            schoolFilter={schoolFilter}
            setSchoolFilter={setSchoolFilter}
            sectorFilter={sectorFilter}
            setSectorFilter={setSectorFilter}
            kanban={kanban}
            setKanban={setKanban}
            onSelect={(contact) => setSelectedId(contact.id)}
          />
          <Analytics contacts={contacts} records={records} onImportRecords={(incoming) => setRecords((current) => [...incoming, ...current])} />
          <GmailScheduler
            queue={queue}
            contactsById={contactsById}
            auth={auth}
            setAuth={setAuth}
            onQueueChange={setQueue}
            onRecord={(record) => setRecords((current) => [record, ...current])}
          />
        </section>

        <aside className="space-y-5">
          <ResumePanel resume={resume} selectedContact={selectedContact} onChange={setResume} />
          <ContactIntelligence contact={selectedContact} resume={resume} />
          <OutreachComposer contact={selectedContact} resume={resume} onQueue={(email) => setQueue((current) => [email, ...current])} />
          <RelationshipPanel
            contact={selectedContact}
            note={note}
            setNote={setNote}
            addNote={addNote}
            updateContact={updateContact}
            recordManualStatus={recordManualStatus}
          />
          <StrategyAdvisor contacts={contacts} records={records} resume={resume} />
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="micro-label">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function RelationshipPanel({
  contact,
  note,
  setNote,
  addNote,
  updateContact,
  recordManualStatus
}: {
  contact?: Contact;
  note: string;
  setNote: (note: string) => void;
  addNote: () => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  recordManualStatus: (status: OutreachStatus) => void;
}) {
  if (!contact) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-slate-700" />
          <div>
            <p className="micro-label">CRM Notes + Response Tracker</p>
            <h2 className="text-lg font-semibold text-slate-950">Relationship control</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="micro-label">Status</span>
            <Select value={contact.status} onChange={(event) => updateContact(contact.id, { status: event.target.value as OutreachStatus })}>
              {["Not Contacted", "Queued", "Scheduled", "Sent", "Delivered", "Replied", "Positive", "No Reply"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1">
            <span className="micro-label">Relationship strength</span>
            <Select
              value={contact.relationshipStrength}
              onChange={(event) => updateContact(contact.id, { relationshipStrength: Number(event.target.value) as Contact["relationshipStrength"] })}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} star{value > 1 ? "s" : ""}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <Textarea rows={3} value={note} placeholder="Add call notes, reply context, or next action..." onChange={(event) => setNote(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={addNote}>
            Add note
          </Button>
          <Button onClick={() => recordManualStatus("Replied")}>
            <CheckCircle2 className="h-4 w-4" /> Mark replied
          </Button>
          <Button onClick={() => recordManualStatus("Positive")}>Mark positive</Button>
        </div>
        <div className="space-y-2">
          {contact.notes.map((item) => (
            <p key={item} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
              {item}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
