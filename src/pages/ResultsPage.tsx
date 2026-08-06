import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Mail, SearchX, TriangleAlert } from 'lucide-react';
import type { Product } from '@/types';
import { useStore } from '@/store/useStore';
import { MIN_SCORE, matchProducts, rejectedProducts } from '@/lib/matching';
import { CERTIFICATION_LABEL } from '@/data/products';
import { supplierAlias } from '@/data/suppliers';
import { ProductCard } from '@/components/ProductCard';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { PageHeader, Section } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

export function ResultsPage() {
  const { briefId } = useParams();
  const navigate = useNavigate();
  const briefs = useStore((s) => s.briefs);
  const products = useStore((s) => s.products);
  const setRole = useStore((s) => s.setRole);
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);

  const brief = briefs.find((b) => b.id === briefId);

  const results = useMemo(() => (brief ? matchProducts(brief, products) : []), [brief, products]);
  const rejected = useMemo(
    () => (brief && results.length === 0 ? rejectedProducts(brief, products) : []),
    [brief, products, results.length],
  );

  if (!brief) {
    return (
      <Section>
        <PageHeader title="Brief not found" description="This brief does not exist in the demo state." />
        <Button className="mt-6" asChild>
          <Link to="/chat">Back to briefing</Link>
        </Button>
      </Section>
    );
  }

  const bestScore = results[0]?.totalScore ?? 0;
  const hasWeakMatchesOnly = results.length > 0 && bestScore < 85;
  const sourcedCount = results.filter(
    (r) => products.find((p) => p.id === r.productId)?.source === 'sourced',
  ).length;

  const criteria = [
    `${brief.category ?? '—'} / ${brief.subCategory ?? '—'}`,
    `${brief.volumeMl ?? '—'} ml`,
    brief.keyIngredients?.length ? brief.keyIngredients.join(', ') : null,
    brief.certifications?.length
      ? brief.certifications.map((c) => CERTIFICATION_LABEL[c]).join(', ')
      : null,
    brief.quantity ? `${formatNumber(brief.quantity)} pcs` : null,
    brief.targetPriceMin != null
      ? `${brief.targetPriceMin.toFixed(2)}–${(brief.targetPriceMax ?? 0).toFixed(2)} €`
      : null,
  ].filter(Boolean) as string[];

  function goToSourcing() {
    setRole('admin');
    navigate(`/admin/sourcing/${brief!.id}`);
  }

  return (
    <Section>
      <PageHeader
        index={`02 / ${brief.id}`}
        title={results.length ? `${results.length} matching products` : 'No product matches yet'}
        description={
          results.length
            ? 'Ranked by weighted match score. The breakdown next to each product shows exactly which criteria are met and where a compromise would be required.'
            : 'The catalog holds nothing that satisfies the hard criteria of this brief. That is the point where manufacturer sourcing starts.'
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/chat">Refine brief</Link>
          </Button>
        }
      />

      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-y border-hairline py-4">
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Brief criteria</span>
        <span className="text-[13px] text-ink-soft">{criteria.join('  ·  ')}</span>
        {sourcedCount > 0 && (
          <Badge variant="lime">
            {sourcedCount} sourced in this session
          </Badge>
        )}
      </div>

      {hasWeakMatchesOnly && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-paper p-5">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-4 text-warn" />
            <div>
              <p className="text-[14px] font-medium">Partial matches only</p>
              <p className="text-[13px] text-muted">
                The best product reaches {bestScore} of 100. Deviations are listed per criterion — or
                we ask manufacturers for an exact fit.
              </p>
            </div>
          </div>
          <Button onClick={goToSourcing}>
            <Mail /> Ask manufacturers
          </Button>
        </div>
      )}

      {results.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {results.map((result, index) => {
            const product = products.find((p) => p.id === result.productId);
            if (!product) return null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                result={result}
                rank={index + 1}
                onOrderSample={setSampleProduct}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-card border border-hairline bg-paper p-6">
            <SearchX className="size-6 text-muted" />
            <h2 className="mt-3 text-xl font-semibold display-tight">
              Nothing in the catalog fits this specification
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              {formatNumber(products.length)} products were scored. Every candidate failed on at
              least one knockout criterion — category or declared actives. Products below{' '}
              {MIN_SCORE} points are not shown, because a compromise there would not be viable
              commercially.
            </p>

            <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Closest candidates and why they fail
            </h3>
            <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
              {rejected.map((result) => {
                const product = products.find((p) => p.id === result.productId);
                if (!product) return null;
                const blockers = result.breakdown.filter((b) => b.verdict !== 'match');
                return (
                  <li key={result.productId} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] font-medium">{product.name}</span>
                      <span className="num text-[12px] text-muted">{result.totalScore}/100</span>
                    </div>
                    <p className="num text-[11px] text-muted">
                      {product.id} · {supplierAlias(product.supplierId)}
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {blockers.map((b) => (
                        <li key={b.criterion}>
                          <Badge variant={b.verdict === 'mismatch' ? 'bad' : 'warn'}>{b.note}</Badge>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="h-fit rounded-card border border-ink bg-ink p-6 text-paper">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-lime">
              Next step
            </span>
            <h3 className="mt-2 text-xl font-semibold display-tight">Source from manufacturers</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-paper/70">
              Labtree contacts the manufacturers whose specialisation fits this brief, evaluates the
              offers and adds them to the catalog. Your brief is then re-matched automatically — and
              the product stays available for future enquiries.
            </p>
            <Button className="mt-5 w-full" onClick={goToSourcing}>
              Start sourcing <ArrowRight />
            </Button>
            <p className="mt-3 text-[11px] text-paper/50">
              Opens the agency view — in production this runs in the background and you receive a
              notification.
            </p>
          </div>
        </div>
      )}

      <SampleOrderDialog
        product={sampleProduct}
        briefId={brief.id}
        onClose={() => setSampleProduct(null)}
      />
    </Section>
  );
}
