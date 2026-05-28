import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

const tones: Record<Tone, string> = {
  slate: "border-slate-300 bg-slate-100 text-slate-700",
  green: "border-emerald-300 bg-emerald-50 text-emerald-700",
  amber: "border-amber-300 bg-amber-50 text-amber-700",
  red: "border-red-300 bg-red-50 text-red-700",
  blue: "border-sky-300 bg-sky-50 text-sky-700"
};

export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
