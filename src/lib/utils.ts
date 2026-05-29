import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO, differenceInDays } from "date-fns";
import type { Contact, Seniority, ContactStatus, Priority } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

export function formatDate(dateStr: string | null, fmt = "MMM d, yyyy"): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return "—";
  }
}

export function getDaysSinceOutreach(lastOutreach: string | null): number | null {
  if (!lastOutreach) return null;
  try {
    return differenceInDays(new Date(), parseISO(lastOutreach));
  } catch {
    return null;
  }
}

export function isNoReply(contact: Contact, days = 7): boolean {
  if (contact.status !== "sent") return false;
  const daysSince = getDaysSinceOutreach(contact.lastOutreach);
  return daysSince !== null && daysSince >= days;
}

// ─── Contact Utilities ────────────────────────────────────────────────────────

export function getLinkedInSearchUrl(contact: Contact): string {
  const query = `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

export function getGoogleSearchUrl(contact: Contact): string {
  const query = `${contact.firstName} ${contact.lastName} ${contact.firm} investment banking`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function getSeniorityLabel(seniority: Seniority): string {
  const map: Record<Seniority, string> = {
    analyst: "Analyst",
    associate: "Associate",
    vp: "Vice President",
    director: "Director",
    md: "Managing Director",
    partner: "Partner",
  };
  return map[seniority] || seniority;
}

export function getSeniorityColor(seniority: Seniority): string {
  const map: Record<Seniority, string> = {
    analyst: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    associate: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
    vp: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    director: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    md: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    partner: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[seniority] || "text-slate-400 bg-slate-400/10";
}

export function getStatusLabel(status: ContactStatus): string {
  const map: Record<ContactStatus, string> = {
    not_contacted: "Not Contacted",
    sent: "Sent",
    replied: "Replied",
    no_reply: "No Reply",
    positive: "Positive",
    coffee_chat: "Coffee Chat",
    closed: "Closed",
  };
  return map[status] || status;
}

export function getStatusColor(status: ContactStatus): string {
  const map: Record<ContactStatus, string> = {
    not_contacted: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    sent: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    replied: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    no_reply: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    positive: "text-green-400 bg-green-400/10 border-green-400/20",
    coffee_chat: "text-teal-400 bg-teal-400/10 border-teal-400/20",
    closed: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  };
  return map[status] || "text-slate-400 bg-slate-400/10";
}

export function getPriorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    high: "text-red-400 bg-red-400/10 border-red-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  return map[priority] || "text-slate-400";
}

export function getFitScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-blue-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function getFitScoreBarColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

// ─── AI Send Time Optimization ────────────────────────────────────────────────

export function getOptimalSendTime(seniority: Seniority, timezone = "America/New_York"): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const hourMap: Record<Seniority, number> = {
    analyst: 8,
    associate: 8,
    vp: 9,
    director: 9,
    md: 10,
    partner: 10,
  };

  const hour = hourMap[seniority] || 9;
  tomorrow.setHours(hour, 0, 0, 0);

  // Skip weekends
  const day = tomorrow.getDay();
  if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1);
  if (day === 6) tomorrow.setDate(tomorrow.getDate() + 2);

  return tomorrow;
}

export function formatSendTime(date: Date): string {
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

// ─── Email Utilities ──────────────────────────────────────────────────────────

export function buildGmailMessage(to: string, subject: string, body: string): string {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    body.replace(/\n/g, "<br>"),
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportContactsToCSV(contacts: Contact[]): void {
  const headers = [
    "Name", "Email", "Firm", "Title", "Team", "School", "Priority",
    "Status", "Fit Score", "Last Outreach", "Notes",
  ];

  const rows = contacts.map((c) => [
    `${c.firstName} ${c.lastName}`,
    c.email,
    c.firm,
    c.title,
    c.team,
    c.school,
    c.priority,
    c.status,
    c.fitScore.toString(),
    c.lastOutreach || "",
    c.notes.replace(/,/g, ";"),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulgebracket-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function computeFitScore(
  contact: Contact,
  userSchool: string,
  targetSectors: string[]
): number {
  let score = 50;

  if (
    contact.school.toLowerCase().includes(userSchool.toLowerCase()) ||
    contact.undergrad.toLowerCase().includes(userSchool.toLowerCase())
  ) {
    score += 30;
  }

  const sectorMatch = targetSectors.some((s) =>
    contact.coverageSectors.some((cs) =>
      cs.toLowerCase().includes(s.toLowerCase())
    )
  );
  if (sectorMatch) score += 15;

  if (contact.seniority === "analyst" || contact.seniority === "associate") score += 5;
  if (contact.priority === "high") score += 5;

  return Math.min(100, Math.max(0, score));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}
