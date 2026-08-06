import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  FastForward,
  FileText,
  Loader2,
  Mail,
  PenLine,
  PlusCircle,
  Send,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { Brief, Certification, EmailThread, ParsedOffer } from '@/types';
import { useStore } from '@/store/useStore';
import { suppliers, supplierById } from '@/data/suppliers';
import { CERTIFICATION_LABEL } from '@/data/products';
import { buildOffer, offerBody } from '@/data/replies';
import { matchProducts } from '@/lib/matching';
import { PageHeader, Section } from '@/components/PageHeader';
import { ThreadStatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { cn, formatNumber, formatTime } from '@/lib/utils';

const STEPS = ['Manufacturers', 'Enquiries', 'Replies', 'Catalog'];

function StepBar({ current }: { current: number }) {
  return (
    <ol className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-hairline py-4">
      {STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'num text-[11px]',
              index <= current ? 'text-ink' : 'text-muted/60',
            )}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className={cn(
              'text-[13px]',
              index === current
                ? 'font-medium text-ink'
                : index < current
                  ? 'text-ink-soft'
                  : 'text-muted/70',
            )}
          >
            {label}
          </span>
          {index < current && <Check className="size-3 text-ink-soft" />}
        </li>
      ))}
    </ol>
  );
}

/**
 * Demo control: instead of waiting for the scripted reply, the presenter can
 * write the manufacturer's email by hand — the AI parses whatever is pasted.
 */
function ManualReply({
  thread,
  brief,
  defaultOpen = false,
}: {
  thread: EmailThread;
  brief: Brief;
  defaultOpen?: boolean;
}) {
  const injectSupplierReply = useStore((s) => s.injectSupplierReply);
  const supplier = supplierById(thread.supplierId)!;
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) {
    return (
      <div className="border-t border-hairline px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
        >
          <PenLine className="size-3.5" /> Write the reply as {supplier.name}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-hairline p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
          Reply as {supplier.name}
        </span>
        <button
          type="button"
          onClick={() => setText(offerBody(brief, supplier, buildOffer(brief, supplier, false), false))}
          className="text-[11px] text-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
        >
          insert example offer
        </button>
      </div>
      <Textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Write the manufacturer's email here — any wording works. Mention product, fill volume, actives, INCI, certifications, price, MOQ and lead time and the AI will extract them.`}
        className="mt-2 text-[12px]"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!text.trim() || sending}
          onClick={async () => {
            setSending(true);
            await injectSupplierReply(thread.id, text);
            setSending(false);
            setOpen(false);
            setText('');
          }}
        >
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
          {sending ? 'Extracting…' : 'Receive reply'}
        </Button>
      </div>
    </div>
  );
}

function ConfidenceTag({ value }: { value?: number }) {
  if (value == null) return null;
  return (
    <Badge variant={value >= 85 ? 'good' : value >= 70 ? 'warn' : 'bad'}>
      <span className="num">{value}%</span>
    </Badge>
  );
}

function OfferReview({ thread }: { thread: EmailThread }) {
  const updateParsedOffer = useStore((s) => s.updateParsedOffer);
  const importOffer = useStore((s) => s.importOffer);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<{ productId: string; newMatches: number } | null>(null);
  const offer = thread.parsedOffer;
  const inbound = [...thread.messages].reverse().find((m) => m.direction === 'inbound');

  if (!offer || !inbound) return null;

  const field = (
    key: keyof ParsedOffer,
    label: string,
    type: 'text' | 'number' = 'text',
    suffix?: string,
  ) => {
    const confidence = offer.fieldConfidence[key as string];
    const low = confidence != null && confidence < 70;
    return (
      <div className={cn('rounded-2xl border p-3', low ? 'border-warn/50 bg-warn-soft' : 'border-hairline')}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${thread.id}-${key}`}>{label}</Label>
          <ConfidenceTag value={confidence} />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            id={`${thread.id}-${key}`}
            type={type}
            value={String(offer[key] ?? '')}
            onChange={(e) =>
              updateParsedOffer(thread.id, {
                [key]: type === 'number' ? Number(e.target.value) : e.target.value,
              } as Partial<ParsedOffer>)
            }
            className="h-9 rounded-xl"
            disabled={Boolean(imported)}
          />
          {suffix && <span className="num text-[12px] text-muted">{suffix}</span>}
        </div>
        {low && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-warn">
            <TriangleAlert className="size-3" /> Low confidence — please confirm
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-4 border-t border-hairline p-5 lg:grid-cols-2">
      <div>
        <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Original email
        </h4>
        <div className="mt-2 rounded-2xl border border-hairline bg-surface p-4">
          <p className="num text-[11px] text-muted">
            From {inbound.from} · {formatTime(inbound.timestamp)}
          </p>
          <p className="mt-1 text-[13px] font-medium">{inbound.subject}</p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-ink-soft">
            {inbound.body}
          </pre>
          {inbound.attachmentName && (
            <span className="mt-3 flex w-fit items-center gap-1.5 rounded-pill border border-hairline bg-paper px-2.5 py-1 text-[11px]">
              <FileText className="size-3" />
              {inbound.attachmentName}
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            Extracted product data
          </h4>
          <div className="flex items-center gap-2">
            <Badge variant="lavender">
              <Sparkles /> AI extraction
            </Badge>
            <ConfidenceTag value={offer.confidence} />
          </div>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {field('productName', 'Product name')}
          {field('volumeMl', 'Fill volume', 'number', 'ml')}
          {field('priceMin', 'Price from', 'number', '€')}
          {field('priceMax', 'Price to', 'number', '€')}
          {field('moq', 'MOQ', 'number', 'pcs')}
          {field('leadTimeWeeks', 'Lead time', 'number', 'wks')}
        </div>

        <div className="mt-2 rounded-2xl border border-hairline p-3">
          <div className="flex items-center justify-between">
            <Label>Actives</Label>
            <ConfidenceTag value={offer.fieldConfidence.keyIngredients} />
          </div>
          <p className="mt-1.5 text-[13px]">{offer.keyIngredients.join(' · ') || '—'}</p>
        </div>

        <div className="mt-2 rounded-2xl border border-hairline p-3">
          <div className="flex items-center justify-between">
            <Label>Certifications</Label>
            <ConfidenceTag value={offer.fieldConfidence.certifications} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {offer.certifications.length === 0 && <Badge variant="outline">none detected</Badge>}
            {offer.certifications.map((c: Certification) => (
              <Badge key={c} variant="neutral">
                {CERTIFICATION_LABEL[c]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-2 rounded-2xl border border-hairline p-3">
          <div className="flex items-center justify-between">
            <Label>INCI</Label>
            <ConfidenceTag value={offer.fieldConfidence.inciExcerpt} />
          </div>
          <Textarea
            rows={2}
            value={offer.inciExcerpt}
            onChange={(e) => updateParsedOffer(thread.id, { inciExcerpt: e.target.value })}
            className="num mt-1.5 rounded-xl p-3 text-[11px]"
            disabled={Boolean(imported)}
          />
        </div>

        {imported ? (
          <div className="mt-3 rounded-2xl border border-good/40 bg-good-soft p-4">
            <p className="text-[13px] font-medium">
              Added to catalog as <span className="num">{imported.productId}</span>
            </p>
            <p className="mt-1 text-[12px] text-ink-soft">
              The brief was automatically re-matched: {imported.newMatches} new match
              {imported.newMatches === 1 ? '' : 'es'}. The product stays available for future
              enquiries.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/admin/catalog/${imported.productId}`}>Open product</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/results/${thread.briefId}`}>
                  Customer view <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="mt-3 w-full"
            disabled={importing}
            onClick={async () => {
              setImporting(true);
              const result = await importOffer(thread.id);
              setImporting(false);
              if (result) setImported(result);
            }}
          >
            {importing ? <Loader2 className="animate-spin" /> : <PlusCircle />}
            {importing ? 'Writing to catalog…' : 'Add to catalog'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SourcingThreadPage() {
  const { briefId } = useParams();
  const briefs = useStore((s) => s.briefs);
  const products = useStore((s) => s.products);
  const allThreads = useStore((s) => s.threads);
  const startSourcing = useStore((s) => s.startSourcing);
  const updateThreadDraft = useStore((s) => s.updateThreadDraft);
  const sendThreads = useStore((s) => s.sendThreads);
  const fastForward = useStore((s) => s.fastForward);
  const followUp = useStore((s) => s.followUp);
  const replyMode = useStore((s) => s.replyMode);
  const setReplyMode = useStore((s) => s.setReplyMode);

  const brief = briefs.find((b) => b.id === briefId);
  const threads = useMemo(
    () => allThreads.filter((t) => t.briefId === briefId),
    [allThreads, briefId],
  );

  const relevant = useMemo(() => {
    if (!brief) return [];
    return suppliers
      .map((supplier) => ({
        supplier,
        productCount: products.filter((p) => p.supplierId === supplier.id).length,
        fits: brief.category ? supplier.specialties.includes(brief.category) : false,
      }))
      .sort((a, b) => Number(b.fits) - Number(a.fits) || b.supplier.reliabilityScore - a.supplier.reliabilityScore);
  }, [brief, products]);

  const [selectedOverride, setSelectedOverride] = useState<string[] | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!brief) {
    return (
      <Section>
        <PageHeader title="Brief not found" />
        <Button className="mt-6" variant="outline" asChild>
          <Link to="/admin/sourcing">Back to sourcing</Link>
        </Button>
      </Section>
    );
  }

  const preselected = relevant
    .filter((r) => r.fits)
    .slice(0, 5)
    .map((r) => r.supplier.id);
  const selected = selectedOverride ?? preselected;
  const setSelected = (updater: (prev: string[]) => string[]) =>
    setSelectedOverride((prev) => updater(prev ?? preselected));

  const drafts = threads.filter((t) => t.status === 'draft');
  const pending = threads.filter((t) => t.status === 'awaiting_reply');
  const answered = threads.filter((t) =>
    ['replied', 'parsed', 'imported', 'declined'].includes(t.status),
  );
  const imported = threads.filter((t) => t.status === 'imported');

  const step =
    threads.length === 0 ? 0 : drafts.length === threads.length ? 1 : imported.length ? 3 : 2;

  const currentMatches = matchProducts(brief, products);

  return (
    <Section>
      <PageHeader
        index={`Admin / Sourcing / ${brief.id}`}
        title="Manufacturer sourcing"
        description={`${brief.category ?? '—'} / ${brief.subCategory ?? '—'} · ${
          brief.volumeMl ?? '—'
        } ml · ${brief.keyIngredients?.join(', ') || 'no actives specified'} · ${
          brief.certifications?.map((c) => CERTIFICATION_LABEL[c]).join(', ') || 'no certifications'
        }`}
        actions={
          <>
            <Badge variant={currentMatches.length ? 'good' : 'bad'}>
              {currentMatches.length} catalog matches
            </Badge>
            <Button variant="outline" asChild>
              <Link to={`/admin/briefs/${brief.id}`}>Brief</Link>
            </Button>
          </>
        }
      />

      <StepBar current={step} />

      {threads.length === 0 && (
        <div className="mt-6 rounded-card border border-hairline bg-paper">
          <div className="border-b border-hairline p-5">
            <h2 className="text-[15px] font-semibold display-tight">
              Select manufacturers ({selected.length})
            </h2>
            <p className="text-[12px] text-muted">
              Pre-selected by specialisation overlap with the brief. Reliability and response time
              come from the manufacturer record.
            </p>
          </div>
          <ul className="grid gap-3 p-5 md:grid-cols-2">
            {relevant.map(({ supplier, productCount, fits }) => {
              const isSelected = selected.includes(supplier.id);
              return (
                <li key={supplier.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(supplier.id)
                          ? prev.filter((id) => id !== supplier.id)
                          : [...prev, supplier.id],
                      )
                    }
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                      isSelected ? 'border-ink bg-surface' : 'border-hairline hover:border-ink/25',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid size-4 shrink-0 place-items-center rounded border',
                        isSelected ? 'border-ink bg-ink text-lime' : 'border-hairline',
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[14px] font-medium">{supplier.name}</span>
                        <span className="num text-[11px] text-muted">{supplier.country}</span>
                      </span>
                      <span className="mt-1 block text-[12px] text-muted">
                        {fits
                          ? `Specialisation: ${supplier.specialties.join(', ')} · ${productCount} products`
                          : `No overlap with ${brief.category} · ${productCount} products`}
                      </span>
                      <span className="num mt-1 block text-[11px] text-muted">
                        Reliability {supplier.reliabilityScore} · reply Ø {supplier.avgResponseDays} d
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline p-5">
            <p className="text-[12px] text-muted">
              One email per manufacturer is generated from the brief and can be edited before sending.
            </p>
            <Button
              disabled={selected.length === 0 || drafting}
              onClick={async () => {
                setDrafting(true);
                await startSourcing(brief.id, selected);
                setDrafting(false);
              }}
            >
              {drafting ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {drafting ? 'Generating enquiries…' : `Generate ${selected.length} enquiries`}
            </Button>
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-surface p-5">
            <div>
              <h2 className="text-[15px] font-semibold display-tight">
                Review enquiries ({drafts.length})
              </h2>
              <p className="text-[12px] text-muted">
                AI-generated from the brief. Edit any email — the version shown here is what gets sent.
                {replyMode === 'manual'
                  ? ' Replies are set to manual: you will write them yourself.'
                  : ' Replies will arrive simulated, within seconds.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-pill bg-paper p-0.5">
                {(['auto', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setReplyMode(mode)}
                    aria-pressed={replyMode === mode}
                    className={cn(
                      'rounded-pill px-3 py-1.5 text-[12px] transition-colors',
                      replyMode === mode
                        ? 'bg-ink font-medium text-paper'
                        : 'text-muted hover:text-ink',
                    )}
                  >
                    {mode === 'auto' ? 'Simulated replies' : 'I write the replies'}
                  </button>
                ))}
              </div>
              <Button onClick={() => sendThreads(brief.id)}>
                <Send /> Send all ({drafts.length})
              </Button>
            </div>
          </div>

          {drafts.map((thread) => {
            const supplier = supplierById(thread.supplierId)!;
            const message = thread.messages[0];
            return (
              <div key={thread.id} className="rounded-card border border-hairline bg-paper">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline p-5">
                  <div>
                    <p className="text-[14px] font-medium">{supplier.name}</p>
                    <p className="num text-[11px] text-muted">
                      {message.from} → {message.to}
                    </p>
                  </div>
                  <Badge variant="lavender">
                    <Sparkles /> AI-generated
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${thread.id}-subject`}>Subject</Label>
                    <Input
                      id={`${thread.id}-subject`}
                      value={message.subject}
                      onChange={(e) => updateThreadDraft(thread.id, e.target.value, message.body)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${thread.id}-body`}>Body</Label>
                    <Textarea
                      id={`${thread.id}-body`}
                      rows={16}
                      value={message.body}
                      onChange={(e) => updateThreadDraft(thread.id, message.subject, e.target.value)}
                      className="num text-[12px]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {threads.length > 0 && drafts.length === 0 && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-surface p-5">
            <div>
              <h2 className="text-[15px] font-semibold display-tight">
                Replies ({answered.length}/{threads.length})
              </h2>
              <p className="text-[12px] text-muted">
                {replyMode === 'auto'
                  ? "Replies arrive on timers scaled to each manufacturer's response behaviour — compressed to seconds for this demo."
                  : 'Manual mode: nothing arrives on its own. Write each manufacturer reply yourself and the AI extracts the product data.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-pill bg-paper p-0.5">
                {(['auto', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setReplyMode(mode)}
                    aria-pressed={replyMode === mode}
                    className={cn(
                      'rounded-pill px-3 py-1.5 text-[12px] transition-colors',
                      replyMode === mode
                        ? 'bg-ink font-medium text-paper'
                        : 'text-muted hover:text-ink',
                    )}
                  >
                    {mode === 'auto' ? 'Simulated replies' : 'I write the replies'}
                  </button>
                ))}
              </div>
              {pending.filter((t) => t.replyKind !== 'silent').length > 0 && (
                <Button variant="outline" onClick={() => void fastForward(brief.id)}>
                  <FastForward /> {replyMode === 'auto' ? 'Fast-forward' : 'Fill in simulated replies'}
                </Button>
              )}
            </div>
          </div>

          {threads.map((thread) => {
            const supplier = supplierById(thread.supplierId)!;
            const isOpen = expanded === thread.id || thread.status === 'parsed';
            return (
              <div key={thread.id} className="rounded-card border border-hairline bg-paper">
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium">{supplier.name}</span>
                      <ThreadStatusBadge status={thread.status} />
                      {thread.composing && (
                        <Badge variant="lavender">
                          <Loader2 className="animate-spin" /> {supplier.name.split(' ')[0]} is
                          writing…
                        </Badge>
                      )}
                      {thread.parsing && (
                        <Badge variant="lavender">
                          <Loader2 className="animate-spin" /> AI extracting product data…
                        </Badge>
                      )}
                    </div>
                    <p className="num text-[11px] text-muted">
                      {thread.messages.length} messages · {supplier.contactEmail}
                      {thread.status === 'awaiting_reply' && thread.replyKind === 'silent'
                        ? ' · no reply yet'
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {thread.status === 'awaiting_reply' && (
                      <Button size="sm" variant="outline" onClick={() => void followUp(thread.id)}>
                        <Mail /> Follow up
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(expanded === thread.id ? null : thread.id)}
                    >
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                      Thread
                    </Button>
                  </div>
                </div>

                {isOpen && thread.status !== 'parsed' && thread.status !== 'imported' && (
                  <ul className="divide-y divide-hairline border-t border-hairline">
                    {thread.messages.map((message) => (
                      <li key={message.id} className="p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={message.direction === 'outbound' ? 'neutral' : 'lavender'}>
                            {message.direction === 'outbound' ? 'Sent' : 'Received'}
                          </Badge>
                          <span className="num text-[11px] text-muted">
                            {message.from} → {message.to} · {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium">{message.subject}</p>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-ink-soft">
                          {message.body}
                        </pre>
                      </li>
                    ))}
                  </ul>
                )}

                {(thread.status === 'parsed' || thread.status === 'imported') && (
                  <OfferReview thread={thread} />
                )}

                {thread.status !== 'parsed' && thread.status !== 'imported' && (
                  <ManualReply
                    thread={thread}
                    brief={brief}
                    defaultOpen={replyMode === 'manual' && thread.status === 'awaiting_reply'}
                  />
                )}
              </div>
            );
          })}

          <div className="rounded-card border border-ink bg-ink p-6 text-paper">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-lime">
              The loop
            </span>
            <h3 className="mt-2 text-xl font-semibold display-tight">
              Brief {brief.id}: {currentMatches.length} match
              {currentMatches.length === 1 ? '' : 'es'} right now
            </h3>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-paper/70">
              Every offer imported here becomes a permanent catalog product. The brief is re-matched
              immediately, and the next customer asking for something similar finds it without any
              sourcing at all — {formatNumber(products.filter((p) => p.source === 'sourced').length)}{' '}
              product(s) have already been added this session.
            </p>
            <Button className="mt-5" asChild>
              <Link to={`/results/${brief.id}`}>
                Open customer view <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
