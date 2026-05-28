import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-900 text-slate-200",
        success: "border-emerald-700 bg-emerald-950 text-emerald-300",
        warning: "border-amber-700 bg-amber-950 text-amber-300",
        critical: "border-red-700 bg-red-950 text-red-300",
        info: "border-blue-700 bg-blue-950 text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
