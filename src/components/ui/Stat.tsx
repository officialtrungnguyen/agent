import { cn } from "../../lib/cn";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
  tone?: "default" | "ink";
}

export function Stat({ label, value, sub, className, tone = "default" }: Props) {
  return (
    <div className={cn("panel px-4 py-3", className)}>
      <div className="micro">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold num", tone === "ink" ? "text-graphite-900" : "text-graphite-900")}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-graphite-500 mt-0.5">{sub}</div>}
    </div>
  );
}
