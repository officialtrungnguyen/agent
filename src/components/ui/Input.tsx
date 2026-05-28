import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-graphite-300 bg-white px-3 text-sm text-graphite-900 placeholder:text-graphite-400 transition-colors focus-visible:border-graphite-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-graphite-400",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 transition-colors focus-visible:border-graphite-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-graphite-400 scrollbar-thin",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-md border border-graphite-300 bg-white px-2.5 text-sm text-graphite-800 transition-colors focus-visible:border-graphite-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-graphite-400",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
