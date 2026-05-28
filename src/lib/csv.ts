import type { Contact } from "@/types";

export function contactsToCSV(contacts: Contact[]): string {
  const cols: (keyof Contact | string)[] = [
    "fullName", "email", "firm", "title", "seniority", "desk", "city", "coverage", "school",
    "priority", "fitScore", "status", "relationshipStars", "lastOutreachAt", "tags",
  ];
  const header = cols.join(",");
  const lines = contacts.map((c) => {
    return cols
      .map((col) => {
        const v: unknown = (c as unknown as Record<string, unknown>)[col as string];
        const text = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
        return `"${text.replace(/"/g, '""')}"`;
      })
      .join(",");
  });
  return [header, ...lines].join("\n");
}

export function parseCSVAsContacts(text: string): Contact[] {
  const rows = text.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rows.length === 0) return [];
  const header = rows[0]!.split(",").map((h) => h.replace(/"/g, "").trim());
  const out: Contact[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = splitCsvLine(rows[i]!);
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => (obj[h] = cells[idx] ?? ""));
    const id = `imp_${Date.now().toString(36)}_${i}`;
    const [firstName, ...rest] = (obj.fullName ?? "").split(/\s+/);
    const lastName = rest.join(" ") || "—";
    if (!obj.email) continue;
    out.push({
      id,
      firstName: firstName ?? "",
      lastName,
      fullName: obj.fullName ?? `${firstName} ${lastName}`,
      email: obj.email,
      firm: (obj.firm as Contact["firm"]) ?? "Houlihan Lokey",
      title: obj.title ?? "Analyst",
      seniority: (obj.seniority as Contact["seniority"]) ?? "Analyst",
      desk: obj.desk ?? "Generalist",
      city: obj.city ?? "New York",
      coverage: (obj.coverage ?? "").split(";").map((s) => s.trim()).filter(Boolean) as Contact["coverage"],
      products: ["M&A"],
      school: obj.school ?? "Wharton",
      priority: (obj.priority as Contact["priority"]) ?? "B",
      fitScore: Number(obj.fitScore ?? 70),
      fitReasoning: ["Imported contact — refit score after resume update"],
      recentDeals: [],
      interests: [],
      icebreakers: [],
      status: (obj.status as Contact["status"]) ?? "not_contacted",
      relationshipStars: (Number(obj.relationshipStars ?? 3) as 1 | 2 | 3 | 4 | 5),
      lastOutreachAt: obj.lastOutreachAt || undefined,
      tags: (obj.tags ?? "").split(";").map((s) => s.trim()).filter(Boolean),
    });
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function downloadFile(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
