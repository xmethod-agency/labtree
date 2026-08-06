import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import type { Certification } from '@/types';
import { useStore } from '@/store/useStore';
import { ALL_CERTIFICATIONS, CATEGORIES, CERTIFICATION_LABEL } from '@/data/products';
import { suppliers, supplierById } from '@/data/suppliers';
import { PageHeader, Section } from '@/components/PageHeader';
import { EmptyRow, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { productImage } from '@/lib/productImage';
import { formatNumber } from '@/lib/utils';

type SortKey = 'name' | 'volume' | 'price' | 'moq' | 'lead';

export function CatalogPage() {
  const products = useStore((s) => s.products);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [certification, setCertification] = useState('all');
  const [source, setSource] = useState('all');
  const [publishFilter, setPublishFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((product) => {
      if (q && !`${product.id} ${product.name} ${product.keyIngredients.join(' ')}`.toLowerCase().includes(q))
        return false;
      if (category !== 'all' && product.category !== category) return false;
      if (supplierId !== 'all' && product.supplierId !== supplierId) return false;
      if (
        certification !== 'all' &&
        !product.certifications.includes(certification as Certification)
      )
        return false;
      if (source !== 'all' && product.source !== source) return false;
      if (publishFilter !== 'all' && product.publishStatus !== publishFilter) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'volume':
          return a.volumeMl - b.volumeMl;
        case 'price':
          return a.priceMin - b.priceMin;
        case 'moq':
          return a.moq - b.moq;
        case 'lead':
          return a.leadTimeWeeks - b.leadTimeWeeks;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, query, category, supplierId, certification, source, publishFilter, sort]);

  const sourced = products.filter((p) => p.source === 'sourced').length;
  const drafts = products.filter((p) => p.publishStatus === 'draft').length;

  return (
    <Section>
      <PageHeader
        index="Admin"
        title="Catalog"
        description={`${formatNumber(products.length)} products · ${sourced} sourced · ${drafts} draft(s) awaiting publish.`}
      />

      <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SKU, name, active…"
            className="h-9 w-full rounded-pill border border-hairline bg-paper pl-9 pr-4 text-[13px] placeholder:text-muted focus-visible:border-ink focus-visible:outline-none"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="all">All manufacturers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select value={certification} onChange={(e) => setCertification(e.target.value)}>
          <option value="all">Any certification</option>
          {ALL_CERTIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {CERTIFICATION_LABEL[c]}
            </option>
          ))}
        </Select>
        <Select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">Any source</option>
          <option value="catalog">Catalog</option>
          <option value="sourced">Sourced</option>
        </Select>
        <Select value={publishFilter} onChange={(e) => setPublishFilter(e.target.value)}>
          <option value="all">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="name">Sort: name</option>
          <option value="volume">Sort: volume</option>
          <option value="price">Sort: price</option>
          <option value="moq">Sort: MOQ</option>
          <option value="lead">Sort: lead time</option>
        </Select>
      </div>

      <p className="mt-3 text-[12px] text-muted">
        {filtered.length} of {products.length} products shown
      </p>

      <div className="mt-3">
        <Table>
          <THead>
            <TR>
              <TH>SKU</TH>
              <TH>Product</TH>
              <TH>Category</TH>
              <TH className="text-right">Volume</TH>
              <TH className="text-right">MOQ</TH>
              <TH className="text-right">Price</TH>
              <TH className="text-right">Lead</TH>
              <TH>Certifications</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={8}>
                No product matches these filters. Reset a filter or source a new product.
              </EmptyRow>
            )}
            {filtered.map((product) => (
              <TR
                key={product.id}
                className="cursor-pointer transition-colors hover:bg-surface"
                onClick={() => navigate(`/admin/catalog/${product.id}`)}
              >
                <TD className="num whitespace-nowrap">
                  {product.id}
                  {product.source === 'sourced' && (
                    <Sparkles className="ml-1.5 inline size-3 text-warn" />
                  )}
                  {product.publishStatus === 'draft' && (
                    <Badge variant="warn" className="ml-1.5">
                      draft
                    </Badge>
                  )}
                </TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <img
                      src={productImage(product)}
                      alt=""
                      loading="lazy"
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                    <span>
                      <span className="block font-medium">{product.name}</span>
                      <span className="text-[11px] text-muted">
                        {supplierById(product.supplierId)?.name}
                      </span>
                    </span>
                  </div>
                </TD>
                <TD className="text-muted">
                  {product.category}
                  <span className="block text-[11px]">{product.subCategory}</span>
                </TD>
                <TD className="num text-right">{product.volumeMl} ml</TD>
                <TD className="num text-right">{formatNumber(product.moq)}</TD>
                <TD className="num whitespace-nowrap text-right">
                  {product.priceMin.toFixed(2)}–{product.priceMax.toFixed(2)} €
                </TD>
                <TD className="num text-right">{product.leadTimeWeeks} w</TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {product.certifications.slice(0, 3).map((c) => (
                      <Badge key={c} variant="neutral">
                        {CERTIFICATION_LABEL[c]}
                      </Badge>
                    ))}
                    {product.certifications.length > 3 && (
                      <Badge variant="outline">+{product.certifications.length - 3}</Badge>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </div>
    </Section>
  );
}
