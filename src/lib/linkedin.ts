import type { Contact } from "../types";

/**
 * Build the exact LinkedIn People search URL per spec.
 * Always uses: firstName + " " + lastName + " " + firm + " " + school.
 */
export function linkedinSearchUrl(c: Pick<Contact, "firstName" | "lastName" | "firm" | "school">): string {
  const keywords = `${c.firstName} ${c.lastName} ${c.firm} ${c.school}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function googleSearchUrl(c: Pick<Contact, "firstName" | "lastName" | "firm" | "school">): string {
  const q = `"${c.firstName} ${c.lastName}" ${c.firm} ${c.school}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function googleNewsUrl(c: Pick<Contact, "firstName" | "lastName" | "firm">): string {
  const q = `"${c.firstName} ${c.lastName}" ${c.firm}`;
  return `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(q)}`;
}
