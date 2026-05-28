import { HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../utils";

export const Button = ({
  className,
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "success" | "warning";
  size?: "sm" | "md";
}) => {
  const variantClasses = {
    default: "bg-slate-100 text-slate-950 hover:bg-white",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    outline: "border border-slate-700 bg-transparent text-slate-100 hover:border-slate-500",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-900",
    success: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    warning: "bg-amber-300 text-slate-950 hover:bg-amber-200",
  };

  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
};

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid-panel rounded-2xl", className)} {...props} />
);

export const Badge = ({
  className,
  tone = "default",
  children,
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  children: ReactNode;
}) => {
  const tones = {
    default: "border-slate-700 text-slate-200 bg-slate-900/90",
    success: "border-emerald-400/30 text-emerald-200 bg-emerald-400/10",
    warning: "border-amber-400/30 text-amber-200 bg-amber-400/10",
    danger: "border-rose-400/30 text-rose-200 bg-rose-400/10",
    muted: "border-slate-700 text-slate-400 bg-slate-950/70",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-slate-500",
      className,
    )}
    {...props}
  />
);

export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-500",
      className,
    )}
    {...props}
  >
    {children}
  </select>
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      "min-h-[120px] w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-slate-500",
      className,
    )}
    {...props}
  />
);

export const Label = ({ children }: { children: ReactNode }) => <div className="mono-label mb-2">{children}</div>;

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 border-b border-slate-800/90 px-5 py-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-1">
      <div className="mono-label">{eyebrow}</div>
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      {description ? <p className="max-w-3xl text-sm text-slate-400">{description}</p> : null}
    </div>
    {actions}
  </div>
);

export const MetricTile = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) => (
  <Card className="p-4">
    <div className="mono-label">{label}</div>
    <div className="mt-3 text-3xl font-semibold text-slate-50">{value}</div>
    <div className="mt-2 text-sm text-slate-400">{detail}</div>
  </Card>
);
