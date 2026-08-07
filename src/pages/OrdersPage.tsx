import { Link } from 'react-router-dom';
import { Check, PackageOpen } from 'lucide-react';
import type { SampleOrderStatus } from '@/types';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import { PageHeader, Section, DataCell } from '@/components/PageHeader';
import { OrderStatusBadge, ORDER_STATUS_LABEL } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { productImage } from '@/lib/productImage';
import { cn, formatDate } from '@/lib/utils';

const FLOW: SampleOrderStatus[] = ['requested', 'label_created', 'shipped', 'delivered'];

export function OrdersPage() {
  const account = useStore(selectCurrentAccount);
  const allOrders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const orders = allOrders.filter(
    (o) => !account || o.accountId === account.id || (!o.accountId && o.customerName === account.name),
  );

  return (
    <Section>
      <PageHeader
        index="04 / Orders"
        title="Your orders"
        description="Sample order status only — products you want to keep live in Catalog. Status changes are made by the Labtree team and appear here immediately."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/catalog">Open catalog</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/chat">New brief</Link>
            </Button>
          </>
        }
      />

      {orders.length === 0 ? (
        <div className="mt-8 rounded-card border border-hairline bg-surface p-10 text-center">
          <PackageOpen className="mx-auto size-6 text-muted" />
          <p className="mt-3 text-[15px] font-medium">No orders yet</p>
          <p className="mt-1 text-[13px] text-muted">
            Save products to your catalog from a brief, then order a sample when you want physical
            evaluation.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/catalog">Go to catalog</Link>
            </Button>
            <Button asChild>
              <Link to="/chat">Start a brief</Link>
            </Button>
          </div>
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
                    const current = index === currentIndex;
                    return (
                      <li
                        key={status}
                        className={cn(
                          'rounded-2xl border px-3 py-3',
                          current
                            ? 'border-ink bg-surface'
                            : done
                              ? 'border-hairline bg-paper'
                              : 'border-hairline bg-surface/40',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'grid size-5 place-items-center rounded-full border text-[10px]',
                              done
                                ? 'border-ink bg-ink text-lime'
                                : 'border-hairline text-muted',
                            )}
                          >
                            {done ? <Check className="size-3" /> : index + 1}
                          </span>
                          <span
                            className={cn(
                              'text-[12px]',
                              current ? 'font-medium text-ink' : 'text-muted',
                            )}
                          >
                            {ORDER_STATUS_LABEL[status]}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
