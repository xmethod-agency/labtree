import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, PackageOpen } from 'lucide-react';
import type { Product, SavedProduct } from '@/types';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import { ProductCard } from '@/components/ProductCard';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { PageHeader, Section } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export function CustomerCatalogPage() {
  const account = useStore(selectCurrentAccount);
  const accountId = useStore((s) => s.currentAccountId);
  const savedProducts = useStore((s) => s.savedProducts);
  const briefs = useStore((s) => s.briefs);
  const products = useStore((s) => s.products);
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);

  const saved = useMemo(
    () => (savedProducts ?? []).filter((item) => item.accountId === accountId),
    [savedProducts, accountId],
  );

  const items = useMemo(() => {
    return saved
      .map((entry) => ({
        entry,
        product: products.find(
          (p) => p.id === entry.productId && p.publishStatus === 'published',
        ),
      }))
      .filter((row): row is { entry: SavedProduct; product: Product } => Boolean(row.product));
  }, [saved, products]);

  return (
    <Section>
      <PageHeader
        index="03 / Catalog"
        title="Your catalog"
        description={`Products you saved from brief matches${
          account ? ` · ${account.company}` : ''
        }. Order a sample when you are ready to evaluate physically.`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/chat">New brief</Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <div className="mt-8 rounded-card border border-hairline bg-surface p-10 text-center">
          <Bookmark className="mx-auto size-6 text-muted" />
          <p className="mt-3 text-[15px] font-medium">Your catalog is empty</p>
          <p className="mt-1 text-[13px] text-muted">
            Save matching products from a brief results page — they stay here even after you start a
            new brief.
          </p>
          <Button className="mt-5" asChild>
            <Link to="/chat">Start a brief</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-[12px] text-muted">
            {items.length} saved product{items.length === 1 ? '' : 's'}
          </p>
          {items.map(({ entry, product }) => (
            <div key={entry.id}>
              <p className="mb-2 text-[11px] text-muted">
                Saved {formatDate(entry.savedAt)}
                {entry.briefId && briefs.some((b) => b.id === entry.briefId) ? (
                  <>
                    {' '}
                    · from brief{' '}
                    <Link
                      to={`/results/${entry.briefId}`}
                      className="num text-ink underline decoration-hairline underline-offset-4"
                    >
                      {entry.briefId}
                    </Link>
                  </>
                ) : null}
              </p>
              <ProductCard
                product={product}
                briefId={entry.briefId}
                onOrderSample={setSampleProduct}
                showCatalogActions
              />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="mt-6 flex items-center gap-2 text-[12px] text-muted">
          <PackageOpen className="size-3.5" />
          Sample order status lives under Orders — saving here only keeps the product shortlist.
        </p>
      )}

      <SampleOrderDialog
        product={sampleProduct}
        briefId={
          sampleProduct
            ? saved.find((s) => s.productId === sampleProduct.id)?.briefId ?? 'catalog'
            : 'catalog'
        }
        onClose={() => setSampleProduct(null)}
      />
    </Section>
  );
}
