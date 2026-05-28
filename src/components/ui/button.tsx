import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-900 hover:bg-white",
        ghost: "bg-transparent text-slate-200 hover:bg-slate-900",
        outline: "bg-transparent text-slate-100 hover:bg-slate-800",
        accent: "bg-amber-400 text-slate-950 hover:bg-amber-300",
      },
      size: {
        default: "h-9",
        sm: "h-8 px-2 text-[10px]",
        lg: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
