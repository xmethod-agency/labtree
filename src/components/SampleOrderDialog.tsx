import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { Product, ShippingAddress } from '@/types';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SampleOrderDialogProps {
  product: Product | null;
  briefId: string;
  onClose: () => void;
}

export function SampleOrderDialog({ product, briefId, onClose }: SampleOrderDialogProps) {
  const createOrder = useStore((s) => s.createOrder);
  const account = useStore(selectCurrentAccount);
  const fallbackAddress: ShippingAddress = account?.address ?? {
    name: '',
    company: '',
    street: '',
    zip: '',
    city: '',
    country: 'Germany',
  };
  const [address, setAddress] = useState<ShippingAddress>(fallbackAddress);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setOrderId(null);
      setAddress(account?.address ?? fallbackAddress);
    }
  }, [product, account?.id]);

  const field = (key: keyof ShippingAddress, label: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`addr-${key}`}>{label}</Label>
      <Input
        id={`addr-${key}`}
        value={address[key]}
        onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {product && !orderId && (
          <>
            <DialogHeader>
              <DialogTitle>Order sample</DialogTitle>
              <DialogDescription>
                <span className="num">{product.id}</span> · {product.name} · {product.volumeMl} ml
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              {field('name', 'Contact')}
              {field('company', 'Company')}
              {field('street', 'Street')}
              {field('zip', 'Postcode')}
              {field('city', 'City')}
              {field('country', 'Country')}
            </div>

            <p className="mt-4 rounded-2xl bg-surface p-4 text-[12px] text-muted">
              Standard samples ship free of charge. Sample shipments are not binding and do not
              constitute an order.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const id = createOrder(briefId, product.id, address);
                  setOrderId(id);
                }}
              >
                Request sample
              </Button>
            </DialogFooter>
          </>
        )}

        {product && orderId && (
          <div className="flex flex-col items-start gap-3">
            <CheckCircle2 className="size-8 text-good" />
            <DialogTitle>Sample requested</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="ink" className="num">
                {orderId}
              </Badge>
              <span className="text-sm text-muted">{product.name}</span>
            </div>
            <p className="text-sm text-ink-soft">
              Your sample will be dispatched within 2 working days to {address.city}. You can track
              the status under Samples — the order is already in the agency queue.
            </p>
            <DialogFooter className="w-full">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button asChild>
                <Link to="/orders" onClick={onClose}>
                  Go to samples
                </Link>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
