import { Link } from 'react-router-dom';
import { ArrowUpRight, Boxes, FileText, Mail, PackageCheck, Factory } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { suppliers } from '@/data/suppliers';
import { PageHeader, Section } from '@/components/PageHeader';
import { BriefStatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatNumber, formatDate, formatTime } from '@/lib/utils';

const KIND_LABEL: Record<string, string> = {
  brief: 'Brief',
  match: 'Matching',
  sourcing: 'Sourcing',
  catalog: 'Catalog',
  sample: 'Sample',
  system: 'System',
};

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  to,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  sub?: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-card border border-hairline bg-paper p-5 transition-colors hover:border-ink/25"
    >
      <div className="flex items-start justify-between">
        <Icon className="size-4 text-muted" />
        <ArrowUpRight className="size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <span className="num mt-4 block text-3xl font-bold display-tight">{value}</span>
      <span className="mt-1 block text-[13px] font-medium">{label}</span>
      {sub && <span className="mt-0.5 block text-[11px] text-muted">{sub}</span>}
    </Link>
  );
}

export function DashboardPage() {
  const briefs = useStore((s) => s.briefs);
  const threads = useStore((s) => s.threads);
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const activity = useStore((s) => s.activity);

  const openBriefs = briefs.filter((b) => b.status !== 'completed');
  const awaiting = threads.filter((t) => t.status === 'awaiting_reply');
  const pendingOrders = orders.filter((o) => o.status !== 'delivered');
  const sourcedProducts = products.filter((p) => p.source === 'sourced');
  const needsSourcing = briefs.filter(
    (b) =>
      b.status === 'sourcing' ||
      (b.matchIds.length === 0 && b.status !== 'draft' && b.status !== 'completed'),
  );

  return (
    <Section>
      <PageHeader
        index="Admin"
        title="Dashboard"
        description={`${formatNumber(products.length)} products from ${suppliers.length} manufacturers. All numbers come from the live demo state.`}
        actions={
          <Button asChild>
            <Link to="/admin/sourcing">
              <Mail /> Sourcing
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          icon={FileText}
          label="Open briefs"
          value={String(openBriefs.length)}
          sub={`${briefs.length} in total`}
          to="/admin/briefs"
        />
        <Stat
          icon={Mail}
          label="Enquiries awaiting reply"
          value={String(awaiting.length)}
          sub={`${threads.length} threads in total`}
          to="/admin/sourcing"
        />
        <Stat
          icon={PackageCheck}
          label="Samples to process"
          value={String(pendingOrders.length)}
          sub={`${orders.length} orders in total`}
          to="/admin/samples"
        />
        <Stat
          icon={Boxes}
          label="Products in catalog"
          value={formatNumber(products.length)}
          sub={`${sourcedProducts.length} sourced in this session`}
          to="/admin/catalog"
        />
        <Stat
          icon={Factory}
          label="Manufacturers"
          value={String(suppliers.length)}
          sub={`${suppliers.filter((s) => s.reliabilityScore >= 85).length} with reliability ≥ 85`}
          to="/admin/suppliers"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="rounded-card border border-hairline bg-paper">
          <div className="flex items-center justify-between border-b border-hairline p-5">
            <h2 className="text-[15px] font-semibold display-tight">Briefs requiring action</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/briefs">All briefs</Link>
            </Button>
          </div>
          {needsSourcing.length === 0 ? (
            <p className="p-5 text-[13px] text-muted">
              No open sourcing cases. Every brief has at least one catalog match.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {needsSourcing.map((brief) => (
                <li key={brief.id} className="flex flex-wrap items-center gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-[12px] text-muted">{brief.id}</span>
                      <BriefStatusBadge status={brief.status} />
                    </div>
                    <p className="mt-1 truncate text-[14px]">
                      {brief.raw || 'No free-text input yet'}
                    </p>
                    <p className="text-[11px] text-muted">
                      {brief.company} · {brief.matchIds.length} matches ·{' '}
                      {brief.inputMethod.toUpperCase()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/sourcing/${brief.id}`}>Source</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-hairline bg-paper">
          <div className="border-b border-hairline p-5">
            <h2 className="text-[15px] font-semibold display-tight">Activity</h2>
          </div>
          <ul className="scrollbar-thin max-h-[420px] divide-y divide-hairline overflow-y-auto">
            {activity.map((item) => (
              <li key={item.id} className="flex items-baseline gap-4 px-5 py-3.5">
                <span className="w-16 shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted">
                  {KIND_LABEL[item.kind] ?? item.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug">{item.text}</p>
                  <p className="num mt-0.5 text-[10px] text-muted">
                    {formatDate(item.timestamp)} · {formatTime(item.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
