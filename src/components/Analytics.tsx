import { useMemo } from "react";
import type { Contact, OutreachEmail } from "../types";
import { Stat } from "./ui/Stat";
import { Pill } from "./ui/Pill";
import { Button } from "./ui/Button";
import { Download, Upload } from "lucide-react";

interface Props {
  contacts: Contact[];
  emails: OutreachEmail[];
  onImportContacts: (rows: Partial<Contact>[]) => void;
}

export function Analytics({ contacts, emails, onImportContacts }: Props) {
  const sent = emails.filter((e) => e.status === "sent");
  const replied = contacts.filter((c) => c.status === "replied" || c.status === "meeting_set");
  const noReply = contacts.filter((c) => c.status === "no_reply");
  const positive = contacts.filter((c) => c.status === "meeting_set");
  const replyRate = sent.length ? Math.round((replied.length / sent.length) * 100) : 0;
  const positiveRate = sent.length ? Math.round((positive.length / sent.length) * 100) : 0;

  // Best subject hooks (n-gram heuristic) — counts wins per first 4 words
  const bestHooks = useMemo(() => {
    const buckets = new Map<string, { sent: number; replied: number }>();
    for (const e of emails) {
      const key = e.subject.split(/\s+/).slice(0, 4).join(" ");
      if (!buckets.has(key)) buckets.set(key, { sent: 0, replied: 0 });
      const b = buckets.get(key)!;
      if (e.status === "sent") {
        b.sent += 1;
        const c = contacts.find((x) => x.id === e.contactId);
        if (c && (c.status === "replied" || c.status === "meeting_set")) b.replied += 1;
      }
    }
    return Array.from(buckets.entries())
      .filter(([_, v]) => v.sent >= 1)
      .sort((a, b) => (b[1].replied / Math.max(1, b[1].sent)) - (a[1].replied / Math.max(1, a[1].sent)))
      .slice(0, 6)
      .map(([hook, v]) => ({ hook, n: v.sent, rate: Math.round((v.replied / Math.max(1, v.sent)) * 100) }));
  }, [emails, contacts]);

  // Best send times — bucket by hour
  const bestSendTimes = useMemo(() => {
    const buckets: Record<number, { sent: number; replied: number }> = {};
    for (const e of emails) {
      if (e.status !== "sent" || !e.sentAt) continue;
      const h = new Date(e.sentAt).getHours();
      const b = buckets[h] || (buckets[h] = { sent: 0, replied: 0 });
      b.sent += 1;
      const c = contacts.find((x) => x.id === e.contactId);
      if (c && (c.status === "replied" || c.status === "meeting_set")) b.replied += 1;
    }
    return Object.entries(buckets)
      .map(([h, v]) => ({ hour: Number(h), n: v.sent, rate: Math.round((v.replied / Math.max(1, v.sent)) * 100) }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }, [emails, contacts]);

  function exportCsv() {
    const rows = [
      ["id", "first", "last", "email", "firm", "title", "team", "school", "city", "priority", "fit", "status", "lastOutreach", "lastReply", "notes"].join(","),
      ...contacts.map((c) => [
        c.id, c.firstName, c.lastName, c.email || "", c.firm, c.title, c.team, c.school, c.city,
        c.priority, c.fitScore ?? "", c.status, c.lastOutreachAt || "", c.lastReplyAt || "", JSON.stringify(c.notes || ""),
      ].map(csvEscape).join(",")),
    ].join("\n");
    download(rows, "bulgebracket_contacts.csv", "text/csv");
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return;
    const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
    const idx = (k: string) => header.indexOf(k);
    const out: Partial<Contact>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const c: Partial<Contact> = {};
      const set = (k: keyof Contact, v: string | undefined) => { if (v != null && v !== "") (c as Record<string, unknown>)[k] = v; };
      set("firstName", cols[idx("first")] || cols[idx("firstname")]);
      set("lastName", cols[idx("last")] || cols[idx("lastname")]);
      set("email", cols[idx("email")]);
      set("firm", cols[idx("firm")]);
      set("title", cols[idx("title")]);
      set("team", cols[idx("team")]);
      set("school", cols[idx("school")]);
      set("city", cols[idx("city")]);
      out.push(c);
    }
    onImportContacts(out);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Sent" value={sent.length} />
        <Stat label="Replied" value={replied.length} />
        <Stat label="Meetings" value={positive.length} />
        <Stat label="No reply" value={noReply.length} />
        <Stat label="Reply rate" value={`${replyRate}%`} />
        <Stat label="Positive rate" value={`${positiveRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Block title="// HIGHEST-CONVERTING HOOKS">
          {bestHooks.length ? bestHooks.map((b) => (
            <Row key={b.hook} left={b.hook} right={<><Pill tone="neutral">n={b.n}</Pill><Pill tone="green">{b.rate}%</Pill></>} />
          )) : <Empty msg="Send more emails to unlock hook insights." />}
        </Block>

        <Block title="// BEST SEND TIMES (LOCAL)">
          {bestSendTimes.length ? bestSendTimes.map((b) => (
            <Row key={b.hour} left={`${b.hour}:00`} right={<><Pill tone="neutral">n={b.n}</Pill><Pill tone="green">{b.rate}%</Pill></>} />
          )) : <Empty msg="Need more sent emails to compute optimal hours." />}
        </Block>
      </div>

      <div className="panel p-4 flex items-center gap-3">
        <Button variant="ghost" leading={<Download size={12} />} onClick={exportCsv}>Export contacts CSV</Button>
        <label className="btn btn-ghost cursor-pointer">
          <Upload size={12} /> Import CSV
          <input type="file" className="hidden" accept=".csv,text/csv" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
          }} />
        </label>
        <div className="micro ml-auto">CSV header: first,last,email,firm,title,team,school,city</div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="micro-strong mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between hairline rounded-sharp px-2.5 py-1.5">
      <div className="text-[12.5px] truncate">{left}</div>
      <div className="flex items-center gap-1">{right}</div>
    </div>
  );
}
function Empty({ msg }: { msg: string }) { return <div className="text-[12.5px] text-graphite-500">{msg}</div>; }

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}
function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
