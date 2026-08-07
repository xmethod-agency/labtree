import { useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react';
import type { MatchResult, Product } from '@/types';
import { CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { supplierAlias, supplierById } from '@/data/suppliers';
import { useStore } from '@/store/useStore';
import { MatchScore } from '@/components/MatchScore';
import { Button } from '@/components/ui/button';
import { DataCell } from '@/components/PageHeader';
import { packagingLabel, productImage } from '@/lib/productImage';
import { cn, formatNumber } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  result?: MatchResult;
  rank?: number;
  briefId?: string | null;
  onOrderSample?: (product: Product) => void;
  /** Show add/remove personal catalog controls for customers. */
  showCatalogActions?: boolean;
  footer?: React.ReactNode;
}

export function ProductCard({
  product,
  result,
  rank,
  briefId,
  onOrderSample,
  showCatalogActions = false,
  footer,
}: ProductCardProps) {
  const [showInci, setShowInci] = useState(false);
  const role = useStore((s) => s.role);
  const revealSupplierNames = useStore((s) => s.revealSupplierNames);
  const toggleSupplierNames = useStore((s) => s.toggleSupplierNames);
  const addToCatalog = useStore((s) => s.addToCatalog);
  const removeFromCatalog = useStore((s) => s.removeFromCatalog);
  const saved = useStore(
    (s) =>
      (s.savedProducts ?? []).some(
        (item) => item.accountId === s.currentAccountId && item.productId === product.id,
      ),
  );
  const supplier = supplierById(product.supplierId);
  const isAdmin = role === 'admin';
  const canSeeName = isAdmin && revealSupplierNames;

  return (
    <article className="overflow-hidden rounded-panel border border-hairline bg-paper transition-colors hover:border-ink/20">
      <div className="grid gap-6 p-4 lg:grid-cols-[210px_minmax(0,1fr)_260px] lg:p-6">
        <div className="relative overflow-hidden rounded-card bg-surface">
          <img
            src={productImage(product)}
            alt={`${product.subCategory} packaging`}
            loading="lazy"
            className="aspect-[4/3] w-full object-contain p-3 lg:aspect-auto lg:h-full lg:p-0 lg:object-cover"
          />
          {rank != null && (
            <span className="num absolute left-3 top-3 rounded-pill bg-paper/90 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              {String(rank).padStart(2, '0')}
            </span>
          )}
          {product.source === 'sourced' && product.publishStatus === 'published' && (
            <span className="absolute bottom-3 left-3 rounded-pill bg-lime px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink">
              newly sourced
            </span>
          )}
          {isAdmin && product.publishStatus === 'draft' && (
            <span className="absolute bottom-3 left-3 rounded-pill bg-warn-soft px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-warn">
              draft
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="num text-[12px] tracking-wider text-muted">{product.id}</span>
            {isAdmin ? (
              <>
                <span className="text-[12px] text-muted">
                  {canSeeName
                    ? `${supplier?.name} · ${supplier?.country}`
                    : supplierAlias(product.supplierId)}
                </span>
                <button
                  type="button"
                  onClick={toggleSupplierNames}
                  className="text-[11px] text-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
                >
                  {revealSupplierNames ? 'hide manufacturer' : 'show manufacturer'}
                </button>
              </>
            ) : null}
          </div>

          <h3 className="mt-1.5 text-[22px] font-semibold display-tight">{product.name}</h3>
          <p className="mt-1 text-[13px] text-muted">
            {product.category} · {product.subCategory} · {product.applicationArea.join(', ')}
          </p>

          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-soft">
            {product.description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-5 border-y border-hairline py-4 sm:grid-cols-4">
            <DataCell label="Fill volume" value={`${product.volumeMl} ml`} />
            <DataCell label="MOQ" value={`${formatNumber(product.moq)} pcs`} />
            <DataCell label="Lead time" value={`${product.leadTimeWeeks} wks`} />
            <DataCell
              label="Price / unit"
              value={`${product.priceMin.toFixed(2)}–${product.priceMax.toFixed(2)} €`}
            />
          </div>

          <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-[92px_minmax(0,1fr)]">
            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Actives</dt>
            <dd>{product.keyIngredients.join(' · ')}</dd>

            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Certified</dt>
            <dd className="text-ink-soft">
              {product.certifications.length
                ? product.certifications.map((c) => CERTIFICATION_LABEL[c]).join(' · ')
                : 'no third-party certification on file'}
            </dd>

            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Label</dt>
            <dd className="text-ink-soft">
              {product.labelTypes.map((l) => LABEL_TYPE_LABEL[l]).join(' · ')}
            </dd>

            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Packaging</dt>
            <dd className="text-ink-soft">
              {packagingLabel(product)} ·{' '}
              {product.inStockSamples ? 'sample in stock' : 'sample on request'}
            </dd>
          </dl>

          <button
            type="button"
            onClick={() => setShowInci((v) => !v)}
            className="mt-4 flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-ink"
          >
            INCI declaration
            {showInci ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <p
            className={cn(
              'num mt-1 text-[11px] leading-relaxed text-muted',
              showInci ? '' : 'line-clamp-1',
            )}
          >
            {product.inciExcerpt}
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:border-l lg:border-hairline lg:pl-6">
          {result ? (
            <MatchScore result={result} />
          ) : (
            <p className="text-[12px] leading-relaxed text-muted">
              No brief context — open this product from a match list to see the score breakdown.
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2">
            {showCatalogActions && role === 'customer' && (
              <Button
                variant={saved ? 'outline' : 'dark'}
                onClick={() =>
                  saved ? removeFromCatalog(product.id) : addToCatalog(product.id, briefId)
                }
              >
                {saved ? <BookmarkCheck /> : <Bookmark />}
                {saved ? 'In your catalog' : 'Save to catalog'}
              </Button>
            )}
            {onOrderSample && <Button onClick={() => onOrderSample(product)}>Order sample</Button>}
            {showCatalogActions && role === 'customer' && saved && (
              <Button variant="ghost" size="sm" onClick={() => removeFromCatalog(product.id)}>
                Remove from catalog
              </Button>
            )}
            {footer}
          </div>
        </div>
      </div>
    </article>
  );
}
