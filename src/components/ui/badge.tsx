import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeTone = "slate" | "green" | "amber" | "red" | "blue" | "violet";

const tones: Record<BadgeTone, string> = {
  slate: "border-slate-300 bg-slate-50 text-slate-700",
  green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  red: "border-red-300 bg-red-50 text-red-800",
  blue: "border-blue-300 bg-blue-50 text-blue-800",
  violet: "border-violet-300 bg-violet-50 text-violet-800"
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
