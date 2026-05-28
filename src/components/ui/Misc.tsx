import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { scoreBand } from "../../lib/scoring";

/** 0–5 star relationship strength. */
export function Stars({
  value,
  onChange,
  size = 14,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i === value ? 0 : i)}
          className={cn("transition-transform", onChange && "hover:scale-110")}
          aria-label={`${i} star`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              i <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-graphite-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Circular fit-score ring. */
export function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const band = scoreBand(score);
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    band.tone === "strong"
      ? "#059669"
      : band.tone === "good"
      ? "#1f6feb"
      : band.tone === "fair"
      ? "#d97706"
      : "#94a3b8";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eceef0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-graphite-900">{score}</span>
    </div>
  );
}

export function StatPill({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-graphite-200 bg-white px-4 py-3">
      <div className="micro-label">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-graphite-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-graphite-400">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-3 text-graphite-300">{icon}</div>}
      <p className="text-sm font-medium text-graphite-700">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-graphite-400">{body}</p>}
    </div>
  );
}
