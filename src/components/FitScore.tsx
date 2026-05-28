import { cn } from "../lib/cn";

export function FitScore({ score, size = "md" }: { score?: number; size?: "sm" | "md" }) {
  const v = score ?? 0;
  const tone =
    v >= 80 ? "text-emerald-700 border-emerald-300 bg-emerald-50"
    : v >= 60 ? "text-graphite-900 border-graphite-300 bg-white"
    : v >= 40 ? "text-graphite-700 border-graphite-200 bg-graphite-50"
    : "text-graphite-500 border-graphite-200 bg-graphite-50";
  const sizeCls = size === "sm" ? "h-6 min-w-[40px] text-[11px]" : "h-7 min-w-[44px] text-xs";
  return (
    <div className={cn("inline-flex items-center justify-center px-1.5 rounded-sharp border font-mono font-semibold tabular-nums", sizeCls, tone)}>
      {v}
    </div>
  );
}
