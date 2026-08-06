import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { supplierById } from '@/data/suppliers';
import { DataCell, PageHeader, Section } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { packagingLabel, productImage } from '@/lib/productImage';
import { formatDate, formatNumber } from '@/lib/utils';

export function ProductDetailPage() {
  const { productId } = useParams();
  const products = useStore((s) => s.products);
  const threads = useStore((s) => s.threads);
  const updateProduct = useStore((s) => s.updateProduct);
  const product = products.find((p) => p.id === productId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    name: product?.name ?? '',
    priceMin: product?.priceMin ?? 0,
    priceMax: product?.priceMax ?? 0,
    moq: product?.moq ?? 0,
    leadTimeWeeks: product?.leadTimeWeeks ?? 0,
    description: product?.description ?? '',
  }));

  if (!product) {
    return (
      <Section>
        <PageHeader title="Product not found" />
        <Button className="mt-6" variant="outline" asChild>
          <Link to="/admin/catalog">
            <ArrowLeft /> Back to catalog
          </Link>
        </Button>
      </Section>
    );
  }

  const supplier = supplierById(product.supplierId);
  const originThread = threads.find((t) => t.createdProductId === product.id);

  return (
    <Section>
      <PageHeader
        index={`Admin / ${product.id}`}
        title={product.name}
        description={`${product.category} / ${product.subCategory} · ${product.applicationArea.join(', ')}`}
        actions={
          <>
            {product.source === 'sourced' && (
              <Badge variant="lime">
                <Sparkles /> Newly sourced
              </Badge>
            )}
            <Button variant="outline" asChild>
              <Link to="/admin/catalog">
                <ArrowLeft /> Catalog
              </Link>
            </Button>
            {editing ? (
              <Button
                onClick={() => {
                  updateProduct(product.id, {
                    name: draft.name,
                    priceMin: Number(draft.priceMin),
                    priceMax: Number(draft.priceMax),
                    moq: Number(draft.moq),
                    leadTimeWeeks: Number(draft.leadTimeWeeks),
                    description: draft.description,
                  });
                  setEditing(false);
                }}
              >
                <Save /> Save
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </Button>
            )}
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-card border border-hairline bg-paper">
            <img
              src={productImage(product)}
              alt={`${product.subCategory} packaging`}
              className="h-64 w-full object-cover"
            />
            <p className="border-t border-hairline px-6 py-3 text-[12px] text-muted">
              {packagingLabel(product)} · reference packaging, not the final artwork
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
              <DataCell label="Source" value={product.source === 'sourced' ? 'Sourced' : 'Catalog'} />
              <DataCell label="Created" value={formatDate(product.createdAt)} />
              <DataCell label="Samples" value={product.inStockSamples ? 'In stock' : 'On request'} />
              <DataCell
                label="Label"
                value={product.labelTypes.map((l) => LABEL_TYPE_LABEL[l]).join(', ')}
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
              Catalog copy
            </h2>
            {editing ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="p-name">Name</Label>
                  <Input
                    id="p-name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="p-pmin">Price from</Label>
                    <Input
                      id="p-pmin"
                      type="number"
                      step="0.05"
                      value={draft.priceMin}
                      onChange={(e) => setDraft((d) => ({ ...d, priceMin: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="p-pmax">Price to</Label>
                    <Input
                      id="p-pmax"
                      type="number"
                      step="0.05"
                      value={draft.priceMax}
                      onChange={(e) => setDraft((d) => ({ ...d, priceMax: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="p-moq">MOQ</Label>
                    <Input
                      id="p-moq"
                      type="number"
                      value={draft.moq}
                      onChange={(e) => setDraft((d) => ({ ...d, moq: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="p-lead">Lead time</Label>
                    <Input
                      id="p-lead"
                      type="number"
                      value={draft.leadTimeWeeks}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, leadTimeWeeks: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="p-desc">Description</Label>
                  <Textarea
                    id="p-desc"
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{product.description}</p>
            )}
          </div>
        </div>

        <div className="flex h-fit flex-col gap-4">
          <div className="rounded-card border border-hairline bg-surface p-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Manufacturer
            </h2>
            <p className="mt-2 text-[15px] font-medium">{supplier?.name}</p>
            <p className="text-[12px] text-muted">
              {supplier?.country} · {supplier?.contactEmail}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <DataCell label="Reliability" value={`${supplier?.reliabilityScore ?? '—'} / 100`} />
              <DataCell label="Response time" value={`${supplier?.avgResponseDays ?? '—'} d`} />
            </div>
            <p className="mt-4 text-[11px] text-muted">
              Manufacturer identity is hidden from customers — they see{' '}
              <span className="font-medium">Manufacturer #n (country)</span> unless the reveal toggle
              is switched on.
            </p>
          </div>

          {originThread && (
            <div className="rounded-card border border-lavender bg-lavender-soft p-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
                Sourcing origin
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed">
                Created from an offer email for brief {originThread.briefId}. Extraction confidence{' '}
                <span className="num font-medium">{originThread.parsedOffer?.confidence}%</span>.
              </p>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to={`/admin/sourcing/${originThread.briefId}`}>Open thread</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
