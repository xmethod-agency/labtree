import type { BriefStatus, SampleOrderStatus, ThreadStatus } from '@/types';
import { Badge } from '@/components/ui/badge';

const BRIEF_STATUS: Record<BriefStatus, { label: string; variant: 'neutral' | 'warn' | 'good' | 'lavender' | 'bad' }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  matching: { label: 'Matching', variant: 'lavender' },
  matched: { label: 'Matched', variant: 'good' },
  sourcing_requested: { label: 'Sourcing requested', variant: 'warn' },
  sourcing: { label: 'Sourcing', variant: 'warn' },
  completed: { label: 'Completed', variant: 'neutral' },
};

const THREAD_STATUS: Record<ThreadStatus, { label: string; variant: 'neutral' | 'warn' | 'good' | 'lavender' | 'bad' }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  sent: { label: 'Sent', variant: 'lavender' },
  awaiting_reply: { label: 'Awaiting form', variant: 'warn' },
  replied: { label: 'Form received', variant: 'lavender' },
  parsed: { label: 'Offer ready', variant: 'good' },
  declined: { label: 'Declined', variant: 'bad' },
  draft_created: { label: 'Draft product', variant: 'lavender' },
  published: { label: 'Published', variant: 'good' },
  imported: { label: 'In catalog', variant: 'good' },
};

const ORDER_STATUS: Record<SampleOrderStatus, { label: string; variant: 'neutral' | 'warn' | 'good' | 'lavender' }> = {
  requested: { label: 'Requested', variant: 'warn' },
  label_created: { label: 'Label created', variant: 'lavender' },
  shipped: { label: 'Shipped', variant: 'lavender' },
  delivered: { label: 'Delivered', variant: 'good' },
};

export function BriefStatusBadge({ status }: { status: BriefStatus }) {
  const s = BRIEF_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function ThreadStatusBadge({ status }: { status: ThreadStatus }) {
  const s = THREAD_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function OrderStatusBadge({ status }: { status: SampleOrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export const ORDER_STATUS_LABEL: Record<SampleOrderStatus, string> = {
  requested: 'Requested',
  label_created: 'Label created',
  shipped: 'Shipped',
  delivered: 'Delivered',
};
