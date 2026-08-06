import { Link } from 'react-router-dom';
import { Check, PackageOpen } from 'lucide-react';
import type { SampleOrderStatus } from '@/types';
import { useStore } from '@/store/useStore';
import { PageHeader, Section, DataCell } from '@/components/PageHeader';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { productImage } from '@/lib/productImage';
import { cn, formatDate } from '@/lib/utils';

const FLOW: SampleOrderStatus[] = ['requested', 'label_created', 'shipped', 'delivered'];

export function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);

  return (
    <Section>
      <PageHeader
        index="03 / Samples"
        title="Your sample orders"
        description="Every sample request and its current shipping status. Status changes are made by the Labtree team and appear here immediately."
        actions={
          <Button variant="outline" asChild>
            <Link to="/chat">New brief</Link>
          </Button>
        }
      />

      {orders.length === 0 ? (
        <div className="mt-8 rounded-card border border-hairline bg-surface p-10 text-center">
          <PackageOpen className="mx-auto size-6 text-muted" />
          <p className="mt-3 text-[15px] font-medium">No sample orders yet</p>
          <p className="mt-1 text-[13px] text-muted">
            Order a sample from a match list and it will show up here with its shipping status.
          </p>
          <Button className="mt-5" asChild>
            <Link to="/chat">Start a brief</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {orders.map((order) => {
            const product = products.find((p) => p.id === order.productId);
            const currentIndex = FLOW.indexOf(order.status);
            return (
              <div key={order.id} className="rounded-card border border-hairline bg-paper p-5 lg:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {product && (
                      <img
                        src={productImage(product)}
                        alt=""
                        className="size-16 shrink-0 rounded-2xl object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="num text-[12px] tracking-wider text-muted">{order.id}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <h3 className="mt-1 text-lg font-semibold display-tight">
                        {product?.name ?? 'Product removed'}
                      </h3>
                      <p className="num text-[12px] text-muted">
                        {order.productId} · {product?.volumeMl ?? '—'} ml · Brief {order.briefId}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <DataCell label="Ordered" value={formatDate(order.createdAt)} />
                    <DataCell
                      label="Tracking"
                      value={order.trackingNumber ?? '—'}
                      tone={order.trackingNumber ? 'default' : 'muted'}
                    />
                  </div>
                </div>

                <ol className="mt-6 grid gap-3 sm:grid-cols-4">
                  {FLOW.map((status, index) => {
                    const done = index <= currentIndex;
                    const entry = order.statusHistory.find((h) => h.status === status);
                    return (
                      <li key={status} className="flex items-start gap-2">
                        <span
                          className={cn(
                            'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border',
                            done ? 'border-ink bg-ink text-lime' : 'border-hairline',
                          )}
                        >
                          {done && <Check className="size-2.5" />}
                        </span>
                        <span>
                          <span
                            className={cn(
                              'block text-[12px] font-medium',
                              done ? 'text-ink' : 'text-muted',
                            )}
                          >
                            {ORDER_STATUS_LABEL[status]}
                          </span>
                          <span className="num block text-[10px] text-muted">
                            {entry ? formatDate(entry.timestamp) : '—'}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <p className="mt-5 rounded-2xl bg-surface p-4 text-[12px] text-muted">
                  Shipping address: {order.shippingAddress.company}, {order.shippingAddress.street},{' '}
                  {order.shippingAddress.zip} {order.shippingAddress.city},{' '}
                  {order.shippingAddress.country}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
