import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-graphite-100 text-graphite-800 border-graphite-200",
  high: "bg-graphite-900 text-graphite-50 border-graphite-800",
  medium: "bg-graphite-200 text-graphite-800 border-graphite-300",
  low: "bg-graphite-50 text-graphite-600 border-graphite-200",
  sent: "bg-slate-100 text-slate-800 border-slate-200",
  replied: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-300",
  queued: "bg-blue-50 text-blue-800 border-blue-200",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
