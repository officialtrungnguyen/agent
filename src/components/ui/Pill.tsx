import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Props {
  tone?: "neutral" | "ink" | "amber" | "green" | "blue" | "red";
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Pill({ tone = "neutral", children, className, title }: Props) {
  const tones: Record<string, string> = {
    neutral: "bg-graphite-100 text-graphite-700 border-graphite-200",
    ink: "bg-graphite-900 text-graphite-50 border-graphite-900",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 h-5 px-1.5 text-[10px] font-mono uppercase tracking-micro rounded-sharp border",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
