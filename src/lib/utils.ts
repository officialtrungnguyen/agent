import type { Contact, SeniorityTier } from "@/types";

/** Tailwind className combiner */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * EXACT LinkedIn people-search URL. Per spec this format is non-negotiable:
 * https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(firstName + " " + lastName + " " + firm + " " + school)}
 */
export function linkedInSearchUrl(c: Pick<Contact, "firstName" | "lastName" | "firm" | "school">): string {
  const keywords = `${c.firstName} ${c.lastName} ${c.firm} ${c.school}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

/** Google search with school injected for disambiguation. */
export function googleSearchUrl(c: Pick<Contact, "firstName" | "lastName" | "firm" | "school">): string {
  const q = `${c.firstName} ${c.lastName} ${c.firm} ${c.school} investment banking`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function fullName(c: Pick<Contact, "firstName" | "lastName">): string {
  return `${c.firstName} ${c.lastName}`;
}

export function initials(c: Pick<Contact, "firstName" | "lastName">): string {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(ts?: number): number | null {
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / DAY_MS);
}

export function formatRelative(ts?: number): string {
  if (!ts) return "—";
  const d = daysSince(ts);
  if (d === null) return "—";
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function formatDateTime(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const seniorityLabel: Record<SeniorityTier, string> = {
  analyst: "Analyst",
  associate: "Associate",
  vp: "VP",
  director: "Director",
  md: "MD",
};

/** Default AI-optimal send windows (local hours) by seniority. */
export const defaultSendWindows: Record<SeniorityTier, [number, number]> = {
  analyst: [7, 9],
  associate: [7, 10],
  vp: [8, 10],
  director: [9, 11],
  md: [9, 11],
};

/**
 * Compute the next optimal send time for a contact's seniority, in the user's
 * timezone. Returns a future timestamp (ms).
 */
export function nextOptimalSendTime(
  seniority: SeniorityTier,
  windows: Record<SeniorityTier, [number, number]> = defaultSendWindows,
  from: Date = new Date(),
): number {
  const [startHour, endHour] = windows[seniority];
  const target = new Date(from);
  // Aim for the middle of the window.
  const midHour = Math.floor((startHour + endHour) / 2);
  target.setHours(midHour, 0, 0, 0);
  // If we've passed today's window end, push to tomorrow.
  if (from.getHours() >= endHour) {
    target.setDate(target.getDate() + 1);
  }
  // Skip weekends — bankers read on weekday mornings.
  const day = target.getDay();
  if (day === 6) target.setDate(target.getDate() + 2); // Sat -> Mon
  if (day === 0) target.setDate(target.getDate() + 1); // Sun -> Mon
  return target.getTime();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
