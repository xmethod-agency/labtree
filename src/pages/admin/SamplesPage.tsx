import type { SampleOrderStatus } from '@/types';
import { useStore } from '@/store/useStore';
import { PageHeader, Section } from '@/components/PageHeader';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { EmptyRow, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/utils';

const NEXT_ACTION: Record<SampleOrderStatus, string | null> = {
  requested: 'Create label',
  label_created: 'Mark as shipped',
  shipped: 'Mark as delivered',
  delivered: null,
};

export function SamplesPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const advanceOrder = useStore((s) => s.advanceOrder);

  const open = orders.filter((o) => o.status !== 'delivered').length;

  return (
    <Section>
      <PageHeader
        index="Admin"
        title="Sample queue"
        description={`${open} of ${orders.length} sample orders still open. Status changes are immediately visible in the customer view.`}
      />

      <div className="mt-8">
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Product</TH>
              <TH>Customer</TH>
              <TH>Ordered</TH>
              <TH>Tracking</TH>
              <TH>Status</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <tbody>
            {orders.length === 0 && (
              <EmptyRow colSpan={7}>
                No sample orders yet. Order a sample in the customer view to fill this queue.
              </EmptyRow>
            )}
            {orders.map((order) => {
              const product = products.find((p) => p.id === order.productId);
              const action = NEXT_ACTION[order.status];
              return (
                <TR key={order.id}>
                  <TD className="num">
                    {order.id}
                    <span className="num block text-[11px] text-muted">{order.briefId}</span>
                  </TD>
                  <TD>
                    <span className="block font-medium">{product?.name ?? '—'}</span>
                    <span className="num text-[11px] text-muted">
                      {order.productId} · {product?.volumeMl ?? '—'} ml
                    </span>
                  </TD>
                  <TD>
                    <span className="block">{order.shippingAddress.company}</span>
                    <span className="text-[11px] text-muted">
                      {order.shippingAddress.zip} {order.shippingAddress.city}
                    </span>
                  </TD>
                  <TD className="num text-muted">
                    {formatDate(order.createdAt)}
                    <span className="block text-[11px]">{formatTime(order.createdAt)}</span>
                  </TD>
                  <TD className="num">{order.trackingNumber ?? '—'}</TD>
                  <TD>
                    <OrderStatusBadge status={order.status} />
                  </TD>
                  <TD className="text-right">
                    {action ? (
                      <Button size="sm" variant="outline" onClick={() => advanceOrder(order.id)}>
                        {action}
                      </Button>
                    ) : (
                      <span className="text-[12px] text-muted">completed</span>
                    )}
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
