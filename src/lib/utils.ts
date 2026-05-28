import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Contact } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyMillions(amount: number): string {
  return `$${amount.toLocaleString()}M`;
}

export function buildLinkedInSearchUrl(contact: Pick<Contact, "firstName" | "lastName" | "firm" | "school">) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school}`)}`;
}

export function buildGoogleSearchUrl(contact: Pick<Contact, "firstName" | "lastName" | "firm" | "school">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school} investment banking`)}`;
}

export function buildCompanyEmail(contact: Pick<Contact, "firstName" | "lastName" | "firm">): string {
  const domainMap: Record<string, string> = {
    "Houlihan Lokey": "hl.com",
    "Piper Sandler": "psc.com",
    "Goldman Sachs": "gs.com",
    "William Blair": "williamblair.com",
    "Moelis & Company": "moelis.com",
    "J.P. Morgan": "jpmorgan.com",
    Evercore: "evercore.com",
    Lazard: "lazard.com",
    "Morgan Stanley": "morganstanley.com",
  };
  const normalized = `${contact.firstName}.${contact.lastName}`.toLowerCase();
  return `${normalized}@${domainMap[contact.firm] ?? "firm.com"}`;
}
