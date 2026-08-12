import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MailQuestion } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supplierById } from '@/data/suppliers';
import { PageHeader, Section } from '@/components/PageHeader';
import { BriefStatusBadge, ThreadStatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CERTIFICATION_LABEL } from '@/data/products';
import { formatDate } from '@/lib/utils';

export function SourcingPage() {
  const briefs = useStore((s) => s.briefs);
  const threads = useStore((s) => s.threads);

  const briefsWithThreads = briefs.filter((b) => threads.some((t) => t.briefId === b.id));
  const openCases = briefs.filter(
    (b) =>
      !threads.some((t) => t.briefId === b.id) &&
      (b.status === 'sourcing_requested' || b.status === 'sourcing'),
  );

  return (
    <Section>
      <PageHeader
        index="Admin"
        title="Sourcing"
        description="Briefs without a viable catalog match, and every manufacturer thread with its extraction status."
      />

      <div className="mt-8 flex flex-col gap-4">
        <div className="rounded-card border border-hairline bg-paper">
          <div className="border-b border-hairline p-5">
            <h2 className="text-[15px] font-semibold display-tight">
              Open sourcing cases ({openCases.length})
            </h2>
            <p className="text-[12px] text-muted">
              Customer-requested sourcing and briefs with no catalog match. Select manufacturers and
              send standardised RFQs.
            </p>
          </div>
          {openCases.length === 0 ? (
            <div className="p-8 text-center">
              <MailQuestion className="mx-auto size-5 text-muted" />
              <p className="mt-2 text-[13px] text-muted">
                No open cases. Run the mineral sunscreen scenario in the customer view to create one.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link to="/chat">Customer briefing</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {openCases.map((brief) => (
                <li key={brief.id} className="flex flex-wrap items-center gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-[12px] text-muted">{brief.id}</span>
                      <BriefStatusBadge status={brief.status} />
                    </div>
                    <p className="mt-1 text-[14px] font-medium">
                      {brief.category ?? '—'} / {brief.subCategory ?? '—'} · {brief.volumeMl ?? '—'} ml
                    </p>
                    <p className="text-[12px] text-muted">
                      {brief.keyIngredients?.join(', ') || 'no actives'} ·{' '}
                      {brief.certifications?.map((c) => CERTIFICATION_LABEL[c]).join(', ') ||
                        'no certifications'}{' '}
                      · {brief.company}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to={`/admin/sourcing/${brief.id}`}>
                      <Mail /> Start sourcing
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {briefsWithThreads.map((brief) => {
          const briefThreads = threads.filter((t) => t.briefId === brief.id);
          const imported = briefThreads.filter((t) => t.status === 'imported').length;
          return (
            <div key={brief.id} className="rounded-card border border-hairline bg-paper">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="num text-[12px] text-muted">{brief.id}</span>
                    <BriefStatusBadge status={brief.status} />
                    {imported > 0 && <Badge variant="lime">{imported} added to catalog</Badge>}
                  </div>
                  <p className="mt-1 text-[15px] font-medium">
                    {brief.category ?? '—'} / {brief.subCategory ?? '—'} · {brief.volumeMl ?? '—'} ml
                  </p>
                  <p className="text-[12px] text-muted">
                    {briefThreads.length} manufacturer threads · created {formatDate(brief.createdAt)}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/admin/sourcing/${brief.id}`}>
                    Open <ArrowRight />
                  </Link>
                </Button>
              </div>
              <ul className="divide-y divide-hairline">
                {briefThreads.map((thread) => (
                  <li key={thread.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <span className="text-[13px]">{supplierById(thread.supplierId)?.name}</span>
                    <div className="flex items-center gap-2">
                      {thread.parsedOffer && (
                        <span className="num text-[11px] text-muted">
                          {thread.parsedOffer.confidence}% confidence
                        </span>
                      )}
                      <ThreadStatusBadge status={thread.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
