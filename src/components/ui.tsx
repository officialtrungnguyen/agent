"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-900 text-slate-50 hover:bg-slate-800 border border-slate-900",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
  outline:
    "bg-white text-slate-900 hover:bg-slate-50 border border-slate-300",
  danger: "bg-white text-red-600 hover:bg-red-50 border border-red-200",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
  icon: "h-9 w-9 p-0",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------------------------- Badge ---------------------------------- */
type Tone = "slate" | "green" | "amber" | "red" | "blue" | "graphite";
const toneStyles: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  graphite: "bg-slate-800 text-slate-100 border-slate-800",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------- Inputs ---------------------------------- */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-ring",
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-ring resize-y leading-relaxed",
        className,
      )}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus-ring",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

/* --------------------------------- Label ----------------------------------- */
export function MicroLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("micro-label", className)}>{children}</div>;
}

/* ---------------------------------- Card ----------------------------------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card-flat", className)}>{children}</div>;
}

/* --------------------------------- Avatar ---------------------------------- */
export function Avatar({
  initials,
  tone = "graphite",
  size = 36,
}: {
  initials: string;
  tone?: Tone;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-medium",
        toneStyles[tone],
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

/* ------------------------------ Score ring --------------------------------- */
export function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color =
    score >= 80 ? "#16a34a" : score >= 65 ? "#2563eb" : score >= 50 ? "#d97706" : "#94a3b8";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums text-slate-900">{score}</span>
    </div>
  );
}

/* ---------------------------------- Stars ---------------------------------- */
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
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n === value ? 0 : n)}
          className={cn("transition-colors", onChange && "hover:scale-110", !onChange && "cursor-default")}
          aria-label={`${n} star`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={n <= value ? "#0f172a" : "none"} stroke={n <= value ? "#0f172a" : "#cbd5e1"} strokeWidth={2}>
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Modal ----------------------------------- */
export function Modal({
  open,
  onClose,
  children,
  className,
  title,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/30 p-4 sm:p-8 backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 my-4 w-full rounded-lg border border-slate-200 bg-white animate-slide-up",
          wide ? "max-w-5xl" : "max-w-2xl",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- Spinner ---------------------------------- */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-current"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- Empty state ------------------------------- */
export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {hint && <div className="max-w-sm text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
