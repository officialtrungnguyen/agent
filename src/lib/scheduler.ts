// ─────────────────────────────────────────────────────────────
// AI-optimal send-time engine
//
// Bankers read at different times by seniority. We compute the next
// optimal send window in the *banker's* timezone, then return an ISO
// timestamp the scheduler can use. Weekends roll to Monday.
// ─────────────────────────────────────────────────────────────

import type { Contact, SeniorityLevel } from "../types";

interface Window {
  startHour: number;
  endHour: number;
  label: string;
}

const WINDOW_BY_LEVEL: Record<SeniorityLevel, Window> = {
  Analyst: { startHour: 7, endHour: 9, label: "7–9 AM" },
  Associate: { startHour: 7, endHour: 9, label: "7–9 AM" },
  "Vice President": { startHour: 8, endHour: 10, label: "8–10 AM" },
  Director: { startHour: 8, endHour: 10, label: "8–10 AM" },
  "Senior Vice President": { startHour: 9, endHour: 11, label: "9–11 AM" },
  "Managing Director": { startHour: 9, endHour: 11, label: "9–11 AM" },
  Partner: { startHour: 9, endHour: 11, label: "9–11 AM" },
};

export function optimalWindowLabel(level: SeniorityLevel): string {
  return WINDOW_BY_LEVEL[level].label;
}

/** Get the hour (0-23) right now in a given IANA timezone. */
function hourInTz(tz: string, base = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false });
    return parseInt(fmt.format(base), 10) % 24;
  } catch {
    return base.getHours();
  }
}

/** Day of week (0=Sun..6=Sat) in a given timezone. */
function dayInTz(tz: string, base = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[fmt.format(base)] ?? base.getDay();
  } catch {
    return base.getDay();
  }
}

/**
 * Compute the next optimal send time as an ISO timestamp.
 * We approximate timezone offset by diffing local vs. target hour.
 */
export function nextOptimalSend(contact: Contact, from: Date = new Date()): Date {
  const win = WINDOW_BY_LEVEL[contact.level];
  const targetHourNow = hourInTz(contact.timezone, from);
  const localHourNow = from.getHours();
  // Offset (in hours) to convert a desired *target* local hour to our local hour.
  const tzOffset = localHourNow - targetHourNow;

  const result = new Date(from);
  // Desired local hour that corresponds to the middle of the target window.
  const desiredTargetHour = win.startHour + 0.5;
  let desiredLocalHour = desiredTargetHour + tzOffset;
  // Normalize
  while (desiredLocalHour < 0) desiredLocalHour += 24;
  while (desiredLocalHour >= 24) desiredLocalHour -= 24;

  result.setHours(Math.floor(desiredLocalHour), Math.round((desiredLocalHour % 1) * 60), 0, 0);

  // If that time already passed today (in target tz), or it's past the window, push to tomorrow.
  if (targetHourNow >= win.endHour || result.getTime() <= from.getTime()) {
    result.setDate(result.getDate() + 1);
  }

  // Avoid weekends in the banker's timezone — roll to Monday.
  let guard = 0;
  while (guard < 5) {
    const dow = dayInTz(contact.timezone, result);
    if (dow === 0) result.setDate(result.getDate() + 1); // Sun -> Mon
    else if (dow === 6) result.setDate(result.getDate() + 2); // Sat -> Mon
    else break;
    guard++;
  }
  return result;
}

export function describeSendPlan(contact: Contact, from: Date = new Date()): string {
  const when = nextOptimalSend(contact, from);
  const win = WINDOW_BY_LEVEL[contact.level];
  return `${when.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} · ${win.label} ${contact.timezone.split("/")[1]?.replace("_", " ") ?? "local"}`;
}

/** A spaced batch plan: staggers a list of contacts across optimal windows. */
export function buildPipelinePlan(contacts: Contact[], from: Date = new Date()): Map<string, Date> {
  const plan = new Map<string, Date>();
  // Group same-window contacts and stagger by a few minutes to look human.
  const counters = new Map<string, number>();
  for (const c of contacts) {
    const base = nextOptimalSend(c, from);
    const key = `${base.toDateString()}-${c.level}`;
    const n = counters.get(key) ?? 0;
    counters.set(key, n + 1);
    const staggered = new Date(base.getTime() + n * 4 * 60 * 1000); // +4 min each
    plan.set(c.id, staggered);
  }
  return plan;
}
