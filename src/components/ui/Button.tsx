import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Button({
  variant = "ghost",
  size = "md",
  leading,
  trailing,
  className,
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-sharp border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizeCls =
    size === "sm" ? "h-7 px-2.5 text-[11px]" : size === "lg" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs";
  const variantCls =
    variant === "primary"
      ? "bg-graphite-900 text-white border-graphite-900 hover:bg-graphite-800"
      : variant === "outline"
      ? "bg-transparent text-graphite-900 border-graphite-300 hover:bg-graphite-100"
      : variant === "danger"
      ? "bg-white text-red-700 border-red-200 hover:bg-red-50"
      : "bg-white text-graphite-900 border-graphite-200 hover:bg-graphite-50";
  return (
    <button {...rest} className={cn(base, sizeCls, variantCls, className)}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}
