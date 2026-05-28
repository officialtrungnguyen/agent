import type { OutreachStatus, Priority } from "../types";

export const STATUS_LABEL: Record<OutreachStatus, string> = {
  not_contacted: "Not contacted",
  queued: "Queued",
  scheduled: "Scheduled",
  sent: "Sent",
  replied: "Replied",
  no_reply: "No reply",
  meeting: "Meeting set",
  closed: "Closed",
};

export const STATUS_TONE: Record<OutreachStatus, "neutral" | "accent" | "green" | "amber" | "slate" | "dark"> = {
  not_contacted: "neutral",
  queued: "accent",
  scheduled: "accent",
  sent: "slate",
  replied: "green",
  no_reply: "amber",
  meeting: "green",
  closed: "dark",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  top: "Top",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PRIORITY_TONE: Record<Priority, "dark" | "accent" | "neutral" | "outline"> = {
  top: "dark",
  high: "accent",
  medium: "neutral",
  low: "outline",
};

export const KANBAN_COLUMNS: { key: OutreachStatus; title: string; statuses: OutreachStatus[] }[] = [
  { key: "not_contacted", title: "Not Contacted", statuses: ["not_contacted"] },
  { key: "queued", title: "Queued / Scheduled", statuses: ["queued", "scheduled"] },
  { key: "sent", title: "Sent", statuses: ["sent"] },
  { key: "replied", title: "Replied / Meeting", statuses: ["replied", "meeting", "closed"] },
  { key: "no_reply", title: "No Reply", statuses: ["no_reply"] },
];

/** Builds the exact LinkedIn people search URL (school injected). */
export function linkedinSearchUrl(firstName: string, lastName: string, firm: string, school: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    firstName + " " + lastName + " " + firm + " " + school,
  )}`;
}

export function googleSearchUrl(firstName: string, lastName: string, firm: string, school: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `"${firstName} ${lastName}" ${firm} ${school} investment banking`,
  )}`;
}
