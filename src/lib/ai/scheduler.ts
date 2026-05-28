import type { Contact } from "../../types";

/**
 * Returns the next "optimal" Date for sending an outreach email
 * based on banker seniority and the user's local timezone.
 *
 *  Analyst:  7-9 AM
 *  Associate/VP: 8-10 AM
 *  Director/MD:  9-11 AM
 *
 * If we're already inside the optimal window, returns ~2 min from now.
 */
export function optimalSendTime(contact: Contact, now: Date = new Date()): Date {
  const window = windowForSeniority(contact.seniority);
  const candidate = new Date(now);
  const dow = candidate.getDay();
  // Skip weekends — bump to Monday
  if (dow === 6) candidate.setDate(candidate.getDate() + 2);
  if (dow === 0) candidate.setDate(candidate.getDate() + 1);

  const hour = candidate.getHours();
  if (hour >= window.start && hour < window.end) {
    candidate.setMinutes(candidate.getMinutes() + 2);
    return candidate;
  }
  if (hour >= window.end) {
    candidate.setDate(candidate.getDate() + 1);
    while (candidate.getDay() === 6 || candidate.getDay() === 0) {
      candidate.setDate(candidate.getDate() + 1);
    }
  }
  candidate.setHours(window.start, randMinute(), 0, 0);
  return candidate;
}

function windowForSeniority(s: Contact["seniority"]) {
  switch (s) {
    case "Analyst":
      return { start: 7, end: 9 };
    case "Associate":
    case "Vice President":
      return { start: 8, end: 10 };
    case "Director":
    case "Managing Director":
    case "Partner":
      return { start: 9, end: 11 };
  }
}

function randMinute(): number {
  return Math.floor(Math.random() * 50) + 5;
}

export function describeWindow(c: Contact): string {
  const w = windowForSeniority(c.seniority);
  return `${formatHour(w.start)}–${formatHour(w.end)} local`;
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr} ${suffix}`;
}
