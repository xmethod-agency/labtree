import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Product } from '@/types';
import { CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { useStore } from '@/store/useStore';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { DataCell, PageHeader, Section } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { packagingLabel, productImage } from '@/lib/productImage';
import { formatNumber } from '@/lib/utils';

export function CustomerProductPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const briefId = searchParams.get('brief') ;
  const products = useStore((s) => s.products);
  const accountId = useStore((s) => s.currentAccountId);
  const addToCatalog = useStore((s) => s.addToCatalog);
  const removeFromCatalog = useStore((s) => s.removeFromCatalog);
  const saved = useStore((s) =>
    (s.savedProducts ?? []).some(
      (item) => item.accountId === s.currentAccountId && item.productId === productId,
    ),
  );
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);

  const product = products.find(
    (p) => p.id === productId && p.publishStatus === 'published',
  );

  if (!product) {
    return (
      <Section>
        <PageHeader title="Product not found" />
        <Button className="mt-6" variant="outline" asChild>
          <Link to="/catalog">
            <ArrowLeft /> Back to catalog
          </Link>
        </Button>
      </Section>
    );
  }

  const backTo = briefId ? `/results/${briefId}` : '/catalog';

  return (
    <Section>
      <PageHeader
        title={product.name}
        description={`${product.category} / ${product.subCategory} · ${product.applicationArea.join(', ')}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={backTo}>
                <ArrowLeft /> Back
              </Link>
            </Button>
            <Button
              variant={saved ? 'outline' : 'dark'}
              onClick={() =>
                saved
                  ? removeFromCatalog(product.id)
                  : addToCatalog(product.id, briefId)
              }
            >
              {saved ? <BookmarkCheck /> : <Bookmark />}
              {saved ? 'In your catalog' : 'Save to catalog'}
            </Button>
            <Button onClick={() => setSampleProduct(product)}>Order sample</Button>
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-card border border-hairline bg-paper">
            <img
              src={productImage(product)}
              alt={`${product.subCategory} packaging`}
              className="h-64 w-full object-cover"
            />
            <p className="border-t border-hairline px-6 py-3 text-[12px] text-muted">
              {packagingLabel(product)} · reference packaging
            </p>
          </div>

          <div className="rounded-card border border-hairline bg-paper p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Specification
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <DataCell label="Fill volume" value={`${product.volumeMl} ml`} />
              <DataCell label="MOQ" value={`${formatNumber(product.moq)} pcs`} />
              <DataCell label="Lead time" value={`${product.leadTimeWeeks} weeks`} />
              <DataCell
                label="Price / unit"
                value={`${product.priceMin.toFixed(2)}–${product.priceMax.toFixed(2)} €`}
              />
              <DataCell
                label="Label"
                value={product.labelTypes.map((l) => LABEL_TYPE_LABEL[l]).join(', ')}
              />
              <DataCell
                label="Samples"
                value={product.inStockSamples ? 'In stock' : 'On request'}
              />
            </div>

            <h2 className="mt-8 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Actives
            </h2>
            <p className="mt-2 text-[14px]">{product.keyIngredients.join(' · ')}</p>

            <h2 className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              INCI declaration
            </h2>
            <p className="num mt-2 text-[12px] leading-relaxed text-ink-soft">{product.inciExcerpt}</p>

            <h2 className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Certifications
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.certifications.length === 0 && (
                <Badge variant="outline">None on file</Badge>
              )}
              {product.certifications.map((c) => (
                <Badge key={c} variant="neutral">
                  {CERTIFICATION_LABEL[c]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-hairline bg-paper p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Description
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{product.description}</p>
          </div>
        </div>

        <div className="h-fit rounded-card border border-hairline bg-surface p-5">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Manufacturer details are handled by Labtree. Save the product to your catalog or order a
            sample to evaluate it physically.
          </p>
          {saved && (
            <Button
              className="mt-4 w-full"
              variant="ghost"
              size="sm"
              onClick={() => removeFromCatalog(product.id)}
            >
              Remove from catalog
            </Button>
          )}
          {!accountId && (
            <Button className="mt-4 w-full" onClick={() => navigate('/login')}>
              Sign in to save
            </Button>
          )}
        </div>
      </div>

      <SampleOrderDialog
        product={sampleProduct}
        briefId={briefId ?? 'catalog'}
        onClose={() => setSampleProduct(null)}
      />
    </Section>
  );
}
