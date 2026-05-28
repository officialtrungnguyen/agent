import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "h-9 w-full border border-slate-800 bg-slate-950 px-2.5 text-xs uppercase tracking-[0.14em] text-slate-200 focus:border-slate-500 focus:outline-none",
      className
    )}
    {...props}
  />
);
