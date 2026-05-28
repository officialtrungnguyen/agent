import * as React from "react";
import { cn } from "../../lib/utils";

type Tone = "neutral" | "slate" | "accent" | "green" | "amber" | "red" | "outline" | "dark";

const TONES: Record<Tone, string> = {
  neutral: "bg-graphite-100 text-graphite-700",
  slate: "bg-graphite-200 text-graphite-800",
  accent: "bg-accent-soft text-accent",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  red: "bg-red-50 text-red-600 border border-red-100",
  outline: "border border-graphite-300 text-graphite-600",
  dark: "bg-graphite-900 text-graphite-50",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  mono = false,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium leading-none",
        mono && "font-mono uppercase tracking-wide text-[10px]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
