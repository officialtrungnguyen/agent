// CSV import/export for the alumni ledger.
import type { Contact, OutreachStatus } from "../types";
import { uid } from "./utils";

const HEADERS = [
  "firstName",
  "lastName",
  "email",
  "firm",
  "title",
  "level",
  "team",
  "division",
  "coverageSectors",
  "school",
  "city",
  "priority",
  "status",
  "relationshipStrength",
  "lastOutreachAt",
] as const;

function escapeCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function contactsToCsv(contacts: Contact[]): string {
  const rows = [HEADERS.join(",")];
  for (const c of contacts) {
    rows.push(
      [
        c.firstName,
        c.lastName,
        c.email,
        c.firm,
        c.title,
        c.level,
        c.team,
        c.division,
        c.coverageSectors.join("; "),
        c.school,
        c.city,
        c.priority,
        c.status,
        String(c.relationshipStrength),
        c.lastOutreachAt ?? "",
      ]
        .map((v) => escapeCell(String(v ?? "")))
        .join(","),
    );
  }
  return rows.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const VALID_STATUS: OutreachStatus[] = [
  "not_contacted", "queued", "scheduled", "sent", "replied", "no_reply", "meeting", "closed",
];

export function csvToContacts(text: string): Contact[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const out: Contact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const get = (name: string) => (idx(name) >= 0 ? cells[idx(name)]?.trim() ?? "" : "");
    const firstName = get("firstName") || get("First Name") || "";
    const lastName = get("lastName") || get("Last Name") || "";
    if (!firstName && !lastName) continue;
    const statusRaw = get("status") as OutreachStatus;
    out.push({
      id: uid("c_import"),
      firstName,
      lastName,
      email: get("email") || `${firstName}.${lastName}@example.com`.toLowerCase(),
      firm: get("firm") || "Unknown Firm",
      title: get("title") || "Analyst",
      level: (get("level") as Contact["level"]) || "Analyst",
      team: get("team") || "Coverage & Advisory",
      division: (get("division") as Contact["division"]) || "Generalist",
      coverageSectors: (get("coverageSectors") || "Diversified").split(/[;|]/).map((s) => s.trim()).filter(Boolean),
      school: get("school") || "Unknown",
      city: get("city") || "New York",
      region: "NY",
      timezone: "America/New_York",
      priority: (["top", "high", "medium", "low"].includes(get("priority")) ? get("priority") : "medium") as Contact["priority"],
      sharedSchool: false,
      recentDeals: [],
      personalStyle: "Imported contact — research before outreach.",
      interests: [],
      status: VALID_STATUS.includes(statusRaw) ? statusRaw : "not_contacted",
      relationshipStrength: Number(get("relationshipStrength")) || 0,
      lastOutreachAt: get("lastOutreachAt") || null,
      lastReplyAt: null,
      notes: [],
      events: [],
    });
  }
  return out;
}
