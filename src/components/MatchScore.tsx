import { Check, Minus, X } from 'lucide-react';
import type { MatchBreakdownItem, MatchResult } from '@/types';
import { CRITERION_LABEL } from '@/lib/matching';
import { cn } from '@/lib/utils';

const VERDICT: Record<
  MatchBreakdownItem['verdict'],
  { bar: string; text: string; icon: typeof Check }
> = {
  match: { bar: 'bg-ink', text: 'text-ink-soft', icon: Check },
  partial: { bar: 'bg-muted', text: 'text-warn', icon: Minus },
  mismatch: { bar: 'bg-bad/70', text: 'text-bad', icon: X },
};

/**
 * Signature visual: the total is only the headline — the weighted segments below
 * encode *why* a product matched. Segment width = criterion weight, fill = score.
 */
export function MatchScore({ result, compact }: { result: MatchResult; compact?: boolean }) {
  const weak = result.totalScore < 60;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-4">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'num text-[40px] font-semibold leading-none display-tight',
              weak ? 'text-bad' : 'text-ink',
            )}
          >
            {result.totalScore}
          </span>
          <span className="num text-[13px] text-muted">/100</span>
        </div>
        <span className="pb-1 text-[10px] uppercase tracking-[0.16em] text-muted">match score</span>
      </div>

      <div
        className="flex h-1.5 gap-1"
        role="img"
        aria-label={`Match score ${result.totalScore} of 100`}
      >
        {result.breakdown.map((item) => (
          <div
            key={item.criterion}
            style={{ flexGrow: item.weight }}
            className="relative overflow-hidden rounded-pill bg-surface-deep"
            title={`${CRITERION_LABEL[item.criterion]}: ${item.score}/100 · weight ${item.weight}%`}
          >
            <div
              className={cn('h-full rounded-pill', VERDICT[item.verdict].bar)}
              style={{ width: `${item.score}%` }}
            />
          </div>
        ))}
      </div>

      {compact ? (
        <p className="text-[11px] leading-relaxed text-muted">
          {result.breakdown
            .filter((item) => item.verdict !== 'match')
            .map((item) => item.note)
            .join(' · ') || 'All criteria met'}
        </p>
      ) : (
        <ul className="mt-1 flex flex-col divide-y divide-hairline border-t border-hairline">
          {result.breakdown.map((item) => {
            const style = VERDICT[item.verdict];
            const Icon = style.icon;
            return (
              <li key={item.criterion} className="flex items-start gap-2.5 py-2.5">
                <Icon className={cn('mt-0.5 size-3.5 shrink-0', style.text)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px]">{CRITERION_LABEL[item.criterion]}</span>
                    <span className="num text-[11px] text-muted">
                      {item.score}
                      <span className="text-muted/70"> · w{item.weight}</span>
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-[12px] leading-snug',
                      item.verdict === 'match' ? 'text-muted' : style.text,
                    )}
                  >
                    {item.note}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
