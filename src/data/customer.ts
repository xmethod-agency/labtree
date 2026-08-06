import type { ShippingAddress } from '@/types';

export const customer = {
  name: 'Lena Brandt',
  role: 'Head of Product',
  company: 'Aurelia Naturkosmetik GmbH',
  email: 'l.brandt@aurelia-naturkosmetik.de',
  address: {
    name: 'Lena Brandt',
    company: 'Aurelia Naturkosmetik GmbH',
    street: 'Hafenstraße 42',
    zip: '20359',
    city: 'Hamburg',
    country: 'Germany',
  } satisfies ShippingAddress,
};

export const agency = {
  name: 'Labtree GmbH',
  contactName: 'Jonas Keller',
  email: 'sourcing@labtree.de',
  signature: 'Jonas Keller\nSourcing & Development\nLabtree GmbH',
};
