import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300",
      className
    )}
    {...props}
  />
);
