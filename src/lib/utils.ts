import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function fmtMoney(valueUsdMillions: number | null): string {
  if (valueUsdMillions == null) return "undisclosed";
  if (valueUsdMillions >= 1000) return `$${(valueUsdMillions / 1000).toFixed(1)}B`;
  return `$${valueUsdMillions.toFixed(0)}M`;
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysBetween(iso?: string | null, to: Date = new Date()): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((to.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "never";
  const days = daysBetween(iso);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Deterministic pastel-ish avatar background from a string. */
export function avatarColor(seed: string): string {
  const palette = [
    "bg-graphite-700",
    "bg-graphite-800",
    "bg-graphite-600",
    "bg-slate-700",
    "bg-zinc-700",
    "bg-neutral-700",
    "bg-stone-700",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
