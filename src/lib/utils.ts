import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function linkedInSearchUrl(
  firstName: string,
  lastName: string,
  firm: string,
  school: string
): string {
  const keywords = `${firstName} ${lastName} ${firm} ${school}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function googleSearchUrl(
  firstName: string,
  lastName: string,
  firm: string,
  school: string
): string {
  const q = `${firstName} ${lastName} ${firm} investment banking ${school}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
