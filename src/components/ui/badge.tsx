import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-graphite-200 bg-white text-graphite-700",
        solid: "border-graphite-900 bg-graphite-900 text-graphite-50",
        muted: "border-graphite-200 bg-graphite-100 text-graphite-700",
        outline: "border-graphite-300 bg-transparent text-graphite-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warn: "border-amber-200 bg-amber-50 text-amber-800",
        danger: "border-red-200 bg-red-50 text-red-700",
        info: "border-sky-200 bg-sky-50 text-sky-700",
        priority_s: "border-graphite-900 bg-graphite-900 text-graphite-50",
        priority_a: "border-graphite-700 bg-graphite-700 text-graphite-50",
        priority_b: "border-graphite-300 bg-white text-graphite-800",
        priority_c: "border-graphite-200 bg-graphite-100 text-graphite-500",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
