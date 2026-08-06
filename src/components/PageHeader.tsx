import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  index?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Section heading in the labtree.de manner: superscript index, then a tight display line. */
export function PageHeader({ index, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-6', className)}>
      <div className="max-w-3xl">
        <h1 className="text-[32px] font-semibold display-tight lg:text-[46px]">
          {index && (
            <sup className="num mr-2.5 align-super text-[12px] font-normal tracking-[0.08em] text-muted lg:text-[13px]">
              {index}
            </sup>
          )}
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted lg:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1240px] px-4 py-10 lg:px-8 lg:py-16', className)}>
      {children}
    </div>
  );
}

export function DataCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'muted';
}) {
  return (
    <div>
      <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span
        className={cn(
          'num mt-1.5 block text-[15px] font-medium',
          tone === 'muted' ? 'text-muted' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Numbered row list, mirroring the "How products are built" section on labtree.de. */
export function ProcessList({
  items,
  activeIndex,
}: {
  items: { label: string; description?: string }[];
  activeIndex: number;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <li
            key={item.label}
            className={cn(
              'flex gap-4 rounded-2xl px-4 py-3 transition-colors',
              isActive ? 'bg-surface' : '',
            )}
          >
            <span
              className={cn(
                'num pt-0.5 text-[11px]',
                isActive ? 'text-ink' : isDone ? 'text-ink-soft' : 'text-muted/60',
              )}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-[15px]',
                  isActive ? 'font-medium text-ink' : isDone ? 'text-ink-soft' : 'text-muted/70',
                )}
              >
                {item.label}
              </span>
              {isActive && item.description && (
                <span className="mt-1 block max-w-xl text-[13px] leading-relaxed text-muted">
                  {item.description}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
