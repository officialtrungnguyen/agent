import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(date: string | number | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const future = Math.abs(days);
    if (future === 0) return "today";
    if (future === 1) return "tomorrow";
    return `in ${future}d`;
  }
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours <= 0) return "just now";
    return `${hours}h ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function daysBetween(a: string | number | Date, b: string | number | Date = Date.now()): number {
  const ad = new Date(a).getTime();
  const bd = new Date(b).getTime();
  return Math.floor((bd - ad) / (1000 * 60 * 60 * 24));
}
