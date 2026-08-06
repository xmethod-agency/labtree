import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { matchProducts } from '@/lib/matching';
import { BriefDataPanel } from '@/components/BriefDataPanel';
import { MatchScore } from '@/components/MatchScore';
import { PageHeader, Section } from '@/components/PageHeader';
import { BriefStatusBadge, ThreadStatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { supplierById } from '@/data/suppliers';
import { cn, formatDate, formatTime } from '@/lib/utils';

export function BriefDetailPage() {
  const { briefId } = useParams();
  const briefs = useStore((s) => s.briefs);
  const chats = useStore((s) => s.chats);
  const products = useStore((s) => s.products);
  const threads = useStore((s) => s.threads);

  const brief = briefs.find((b) => b.id === briefId);
  const results = useMemo(() => (brief ? matchProducts(brief, products) : []), [brief, products]);
  const briefThreads = threads.filter((t) => t.briefId === briefId);
  const transcript = brief ? chats[brief.id] ?? [] : [];

  if (!brief) {
    return (
      <Section>
        <PageHeader title="Brief not found" />
        <Button className="mt-6" variant="outline" asChild>
          <Link to="/admin/briefs">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </Section>
    );
  }

  return (
    <Section>
      <PageHeader
        index={`Admin / ${brief.id}`}
        title={`${brief.category ?? 'Unspecified'} · ${brief.subCategory ?? '—'}`}
        description={brief.raw || 'No free-text input recorded.'}
        actions={
          <>
            <BriefStatusBadge status={brief.status} />
            <Button variant="outline" asChild>
              <Link to={`/results/${brief.id}`}>Customer view</Link>
            </Button>
            <Button asChild>
              <Link to={`/admin/sourcing/${brief.id}`}>
                <Mail /> Sourcing
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-card border border-hairline bg-paper">
            <div className="border-b border-hairline p-5">
              <h2 className="text-[15px] font-semibold display-tight">Chat transcript</h2>
              <p className="text-[12px] text-muted">
                {transcript.length} messages · received via {brief.inputMethod.toUpperCase()}
              </p>
            </div>
            {transcript.length === 0 ? (
              <p className="p-5 text-[13px] text-muted">No messages recorded for this brief.</p>
            ) : (
              <ul className="flex flex-col gap-3 p-5">
                {transcript.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[13px] leading-relaxed',
                      message.role === 'user'
                        ? 'ml-auto bg-ink text-paper'
                        : 'bg-surface text-ink',
                    )}
                  >
                    {message.content}
                    <span
                      className={cn(
                        'num mt-1.5 block text-[10px]',
                        message.role === 'user' ? 'text-paper/50' : 'text-muted',
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-card border border-hairline bg-paper">
            <div className="border-b border-hairline p-5">
              <h2 className="text-[15px] font-semibold display-tight">
                Match result ({results.length})
              </h2>
              <p className="text-[12px] text-muted">
                Recomputed live against {products.length} catalog products.
              </p>
            </div>
            {results.length === 0 ? (
              <p className="p-5 text-[13px] text-muted">
                No product satisfies the hard criteria — sourcing required.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {results.map((result) => {
                  const product = products.find((p) => p.id === result.productId)!;
                  return (
                    <li key={result.productId} className="grid gap-4 p-5 md:grid-cols-[1fr_280px]">
                      <div>
                        <Link
                          to={`/admin/catalog/${product.id}`}
                          className="text-[15px] font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="num text-[11px] text-muted">
                          {product.id} · {supplierById(product.supplierId)?.name} ·{' '}
                          {product.volumeMl} ml
                        </p>
                      </div>
                      <MatchScore result={result} compact />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {briefThreads.length > 0 && (
            <div className="rounded-card border border-hairline bg-paper">
              <div className="border-b border-hairline p-5">
                <h2 className="text-[15px] font-semibold display-tight">
                  Sourcing threads ({briefThreads.length})
                </h2>
              </div>
              <ul className="divide-y divide-hairline">
                {briefThreads.map((thread) => (
                  <li key={thread.id} className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <p className="text-[14px] font-medium">
                        {supplierById(thread.supplierId)?.name}
                      </p>
                      <p className="num text-[11px] text-muted">
                        {thread.messages.length} messages ·{' '}
                        {thread.sentAt ? formatDate(thread.sentAt) : 'not sent'}
                      </p>
                    </div>
                    <ThreadStatusBadge status={thread.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <BriefDataPanel brief={brief} className="h-fit lg:sticky lg:top-20" />
      </div>
    </Section>
  );
}
