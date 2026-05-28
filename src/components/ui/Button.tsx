import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-graphite-900 text-graphite-50 hover:bg-graphite-800 active:bg-graphite-950",
  secondary: "bg-graphite-100 text-graphite-900 hover:bg-graphite-200",
  ghost: "text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900",
  outline: "border border-graphite-300 bg-white text-graphite-800 hover:bg-graphite-50 hover:border-graphite-400",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  subtle: "bg-accent text-white hover:bg-accent/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
  icon: "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-graphite-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
