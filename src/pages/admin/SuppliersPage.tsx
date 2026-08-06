import { useStore } from '@/store/useStore';
import { suppliers } from '@/data/suppliers';
import { PageHeader, Section } from '@/components/PageHeader';
import { TD, TH, THead, TR, Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function SuppliersPage() {
  const products = useStore((s) => s.products);
  const threads = useStore((s) => s.threads);

  return (
    <Section>
      <PageHeader
        index="Admin"
        title="Manufacturers"
        description="Production network with reliability, response behaviour and portfolio size. Product counts and lead times are derived from the catalog."
      />

      <div className="mt-8">
        <Table>
          <THead>
            <TR>
              <TH>Manufacturer</TH>
              <TH>Country</TH>
              <TH>Specialisation</TH>
              <TH className="text-right">Products</TH>
              <TH className="text-right">Avg. lead time</TH>
              <TH className="text-right">Response</TH>
              <TH className="text-right">Enquiries</TH>
              <TH>Reliability</TH>
            </TR>
          </THead>
          <tbody>
            {suppliers.map((supplier) => {
              const own = products.filter((p) => p.supplierId === supplier.id);
              const avgLead = own.length
                ? Math.round(
                    (own.reduce((sum, p) => sum + p.leadTimeWeeks, 0) / own.length) * 10,
                  ) / 10
                : 0;
              const supplierThreads = threads.filter((t) => t.supplierId === supplier.id);
              const replied = supplierThreads.filter((t) =>
                ['replied', 'parsed', 'imported', 'declined'].includes(t.status),
              ).length;

              return (
                <TR key={supplier.id}>
                  <TD>
                    <span className="block font-medium">{supplier.name}</span>
                    <span className="num text-[11px] text-muted">{supplier.contactEmail}</span>
                  </TD>
                  <TD className="num">{supplier.country}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {supplier.specialties.map((s) => (
                        <Badge key={s} variant="neutral">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TD>
                  <TD className="num text-right">{own.length}</TD>
                  <TD className="num text-right">{avgLead ? `${avgLead} w` : '—'}</TD>
                  <TD className="num text-right">{supplier.avgResponseDays} d</TD>
                  <TD className="num text-right">
                    {supplierThreads.length ? `${replied}/${supplierThreads.length}` : '—'}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-pill bg-surface-deep">
                        <div
                          className="h-full rounded-pill bg-ink"
                          style={{ width: `${supplier.reliabilityScore}%` }}
                        />
                      </div>
                      <span className="num text-[12px]">{supplier.reliabilityScore}</span>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </div>
    </Section>
  );
}
