import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-slate-700 bg-slate-100 text-slate-950 hover:bg-white',
        secondary: 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
        ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-slate-900/70',
        outline: 'border-slate-700 bg-transparent text-slate-100 hover:bg-slate-900/70',
        amber: 'border-amber-400/40 bg-amber-400/12 text-amber-200 hover:bg-amber-400/18',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));
Button.displayName = 'Button';

export { Button, buttonVariants };
