import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[11px] font-medium tracking-wide [&_svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'border-hairline bg-surface text-ink-soft',
        outline: 'border-hairline bg-paper text-muted',
        ink: 'border-ink bg-ink text-paper',
        lime: 'border-lime-deep bg-lime text-ink',
        lavender: 'border-lavender bg-paper text-ink',
        good: 'border-good/25 bg-paper text-good',
        warn: 'border-warn/25 bg-paper text-warn',
        bad: 'border-bad/25 bg-paper text-bad',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
