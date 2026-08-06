import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-pill border border-hairline bg-paper px-4 text-sm text-ink placeholder:text-muted focus-visible:border-ink focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-2xl border border-hairline bg-paper p-4 text-sm leading-relaxed text-ink placeholder:text-muted focus-visible:border-ink focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-[11px] font-medium uppercase tracking-[0.14em] text-muted', className)}
      {...props}
    />
  );
}
