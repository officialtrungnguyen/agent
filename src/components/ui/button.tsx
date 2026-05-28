import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs uppercase tracking-[0.16em] transition-colors disabled:pointer-events-none disabled:opacity-50 font-medium",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-900 hover:bg-white border border-slate-200",
        ghost: "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent",
        outline: "border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white",
        accent: "border border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-200"
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 px-2.5 py-1",
        lg: "h-10 px-4 py-2"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
