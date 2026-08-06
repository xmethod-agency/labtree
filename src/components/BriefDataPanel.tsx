import type { Brief, BriefField, Certification, LabelType } from '@/types';
import { CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { Badge } from '@/components/ui/badge';
import { cn, formatNumber } from '@/lib/utils';

const FIELDS: { field: BriefField; label: string }[] = [
  { field: 'category', label: 'Category' },
  { field: 'subCategory', label: 'Texture' },
  { field: 'applicationArea', label: 'Application area' },
  { field: 'volumeMl', label: 'Fill volume' },
  { field: 'keyIngredients', label: 'Actives' },
  { field: 'certifications', label: 'Certifications' },
  { field: 'labelType', label: 'Label' },
  { field: 'quantity', label: 'Quantity' },
  { field: 'targetPriceMin', label: 'Target price' },
  { field: 'notes', label: 'Note' },
];

function renderValue(brief: Brief, field: BriefField) {
  switch (field) {
    case 'volumeMl':
      return brief.volumeMl != null ? `${brief.volumeMl} ml` : null;
    case 'quantity':
      return brief.quantity != null ? `${formatNumber(brief.quantity)} pcs` : null;
    case 'targetPriceMin':
      return brief.targetPriceMin != null || brief.targetPriceMax != null
        ? `${(brief.targetPriceMin ?? 0).toFixed(2)}–${(brief.targetPriceMax ?? 0).toFixed(2)} €`
        : null;
    case 'certifications':
      return brief.certifications?.length
        ? brief.certifications.map((c: Certification) => CERTIFICATION_LABEL[c]).join(', ')
        : brief.certifications
          ? 'none required'
          : null;
    case 'labelType':
      return brief.labelType ? LABEL_TYPE_LABEL[brief.labelType as LabelType] : null;
    case 'applicationArea':
      return brief.applicationArea?.length ? brief.applicationArea.join(', ') : null;
    case 'keyIngredients':
      return brief.keyIngredients?.length
        ? brief.keyIngredients.join(', ')
        : brief.keyIngredients
          ? 'open'
          : null;
    default: {
      const value = brief[field];
      return value == null ? null : String(value);
    }
  }
}

export function BriefDataPanel({
  brief,
  recentFields = [],
  className,
}: {
  brief: Brief;
  recentFields?: BriefField[];
  className?: string;
}) {
  const filled = FIELDS.filter(({ field }) => renderValue(brief, field) !== null).length;

  return (
    <aside className={cn('rounded-card border border-hairline bg-surface', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-hairline p-5">
        <div>
          <h2 className="text-[15px] font-semibold display-tight">Detected brief data</h2>
          <p className="num text-[11px] text-muted">{brief.id}</p>
        </div>
        <div className="text-right">
          <span className="num text-xl font-bold">
            {filled}
            <span className="text-muted">/{FIELDS.length}</span>
          </span>
          <span className="block text-[10px] uppercase tracking-[0.14em] text-muted">fields</span>
        </div>
      </div>

      <dl className="divide-y divide-hairline">
        {FIELDS.map(({ field, label }) => {
          const value = renderValue(brief, field);
          const confidence = brief.confidence?.[field];
          const isRecent = recentFields.includes(field);
          return (
            <div
              key={field}
              className={cn(
                'flex items-start justify-between gap-3 px-5 py-2.5',
                isRecent && 'field-pop',
              )}
            >
              <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                {label}
              </dt>
              <dd className="flex min-w-0 items-center gap-2 text-right">
                {value ? (
                  <span className="text-[13px] font-medium">{value}</span>
                ) : (
                  <span className="text-[13px] text-muted/60">—</span>
                )}
                {value && confidence != null && (
                  <Badge variant={confidence >= 85 ? 'good' : confidence >= 70 ? 'warn' : 'bad'}>
                    <span className="num">{confidence}%</span>
                  </Badge>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="border-t border-hairline p-5 text-[11px] leading-relaxed text-muted">
        Fields are extracted from the conversation in real time. Empty fields are asked back by the
        assistant; certifications and actives are hard criteria in the matching.
      </p>
    </aside>
  );
}
