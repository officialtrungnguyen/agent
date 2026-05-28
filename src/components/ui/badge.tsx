import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', {
  variants: {
    variant: {
      slate: 'border-slate-700 bg-slate-900 text-slate-200',
      green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
      amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
      blue: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
      rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    },
  },
  defaultVariants: { variant: 'slate' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
