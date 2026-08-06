import { FormEvent, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Certification, LabelType, SupplierFormSubmission } from '@/types';
import { ALL_CERTIFICATIONS, CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { supplierById } from '@/data/suppliers';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

const LABEL_OPTIONS: LabelType[] = ['white_label', 'private_label'];

export function SupplierResponsePage() {
  const { token } = useParams();
  const threads = useStore((s) => s.threads);
  const briefs = useStore((s) => s.briefs);
  const submitSupplierForm = useStore((s) => s.submitSupplierForm);

  const thread = useMemo(() => threads.find((t) => t.formToken === token), [threads, token]);
  const brief = useMemo(
    () => briefs.find((b) => b.id === thread?.briefId),
    [briefs, thread?.briefId],
  );
  const supplier = thread ? supplierById(thread.supplierId) : undefined;

  const [form, setForm] = useState<SupplierFormSubmission>({
    productName: '',
    volumeMl: brief?.volumeMl ?? 0,
    keyIngredients: brief?.keyIngredients?.join(', ') ?? '',
    certifications: brief?.certifications ?? [],
    priceMin: brief?.targetPriceMin ?? 0,
    priceMax: brief?.targetPriceMax ?? 0,
    moq: 500,
    leadTimeWeeks: 8,
    labelTypes: brief?.labelType ? [brief.labelType] : ['white_label', 'private_label'],
    inciExcerpt: '',
    notes: '',
    sampleAvailable: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (!thread || !brief || !supplier) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Form not found</h1>
        <p className="mt-2 text-[13px] text-muted">
          This response link is invalid, or the enquiry has not been sent yet.
        </p>
      </div>
    );
  }

  const alreadySubmitted =
    thread.status === 'draft_created' ||
    thread.status === 'published' ||
    thread.status === 'imported' ||
    Boolean(thread.createdProductId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    const result = await submitSupplierForm(token, form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(result.productId);
  }

  function toggleCert(cert: Certification) {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(cert)
        ? f.certifications.filter((c) => c !== cert)
        : [...f.certifications, cert],
    }));
  }

  function toggleLabel(label: LabelType) {
    setForm((f) => ({
      ...f,
      labelTypes: f.labelTypes.includes(label)
        ? f.labelTypes.filter((l) => l !== label)
        : [...f.labelTypes, label],
    }));
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Supplier response form
        </p>
        <h1 className="mt-2 text-2xl font-semibold display-tight">Offer for {brief.id}</h1>
        <p className="mt-1 text-[13px] text-muted">
          Addressed to <span className="text-ink">{supplier.name}</span> · confidential Labtree RFQ
        </p>
      </div>

      <div className="mb-6 rounded-card border border-hairline bg-surface p-5">
        <h2 className="text-[13px] font-medium">Standardised request</h2>
        <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Product</dt>
            <dd>
              {brief.category ?? '—'} / {brief.subCategory ?? '—'} · {brief.volumeMl ?? '—'} ml
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Actives</dt>
            <dd>{brief.keyIngredients?.join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Certifications</dt>
            <dd>
              {brief.certifications?.map((c) => CERTIFICATION_LABEL[c]).join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Quantity / price</dt>
            <dd>
              {brief.quantity ? `${formatNumber(brief.quantity)} pcs` : '—'} ·{' '}
              {brief.targetPriceMin != null
                ? `${brief.targetPriceMin.toFixed(2)}–${(brief.targetPriceMax ?? 0).toFixed(2)} €`
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {done || alreadySubmitted ? (
        <div className="rounded-card border border-good/40 bg-good-soft p-6">
          <h2 className="text-[15px] font-semibold">Offer submitted</h2>
          <p className="mt-2 text-[13px] text-ink-soft">
            Thank you. Labtree will review your data and publish the product to the catalog after
            validation. Draft reference:{' '}
            <span className="num">{done ?? thread.createdProductId}</span>
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/login">Labtree portal</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="rounded-card border border-hairline bg-paper p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sf-name">Product name</Label>
              <Input
                id="sf-name"
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-vol">Fill volume (ml)</Label>
              <Input
                id="sf-vol"
                type="number"
                value={form.volumeMl || ''}
                onChange={(e) => setForm((f) => ({ ...f, volumeMl: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-moq">MOQ (pcs)</Label>
              <Input
                id="sf-moq"
                type="number"
                value={form.moq || ''}
                onChange={(e) => setForm((f) => ({ ...f, moq: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-pmin">Price from (€)</Label>
              <Input
                id="sf-pmin"
                type="number"
                step="0.01"
                value={form.priceMin || ''}
                onChange={(e) => setForm((f) => ({ ...f, priceMin: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-pmax">Price to (€)</Label>
              <Input
                id="sf-pmax"
                type="number"
                step="0.01"
                value={form.priceMax || ''}
                onChange={(e) => setForm((f) => ({ ...f, priceMax: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-lead">Lead time (weeks)</Label>
              <Input
                id="sf-lead"
                type="number"
                value={form.leadTimeWeeks || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, leadTimeWeeks: Number(e.target.value) }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sf-actives">Key actives (comma-separated)</Label>
              <Input
                id="sf-actives"
                value={form.keyIngredients}
                onChange={(e) => setForm((f) => ({ ...f, keyIngredients: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sf-inci">INCI excerpt</Label>
              <Textarea
                id="sf-inci"
                rows={3}
                value={form.inciExcerpt}
                onChange={(e) => setForm((f) => ({ ...f, inciExcerpt: e.target.value }))}
                className="num text-[12px]"
              />
            </div>
          </div>

          <div className="mt-5">
            <Label>Certifications</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_CERTIFICATIONS.map((cert) => {
                const active = form.certifications.includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCert(cert)}
                    className="focus-visible:outline-none"
                  >
                    <Badge variant={active ? 'good' : 'outline'}>{CERTIFICATION_LABEL[cert]}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <Label>Label types</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {LABEL_OPTIONS.map((label) => {
                const active = form.labelTypes.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className="focus-visible:outline-none"
                  >
                    <Badge variant={active ? 'lavender' : 'outline'}>
                      {LABEL_TYPE_LABEL[label]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-1.5">
            <Label htmlFor="sf-notes">Notes</Label>
            <Textarea
              id="sf-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={form.sampleAvailable}
              onChange={(e) => setForm((f) => ({ ...f, sampleAvailable: e.target.checked }))}
            />
            Sample available on request
          </label>

          {error && <p className="mt-4 text-[13px] text-bad">{error}</p>}

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit offer'}
          </Button>
        </form>
      )}
    </div>
  );
}
