import type { Account, ShippingAddress } from '@/types';

export const DEMO_PASSWORD = 'demo123';

const aureliaAddress: ShippingAddress = {
  name: 'Lena Brandt',
  company: 'Aurelia Naturkosmetik GmbH',
  street: 'Hafenstraße 42',
  zip: '20359',
  city: 'Hamburg',
  country: 'Germany',
};

const nordlichtAddress: ShippingAddress = {
  name: 'Markus Weber',
  company: 'Nordlicht Beauty AG',
  street: 'Seefeldstrasse 18',
  zip: '8008',
  city: 'Zürich',
  country: 'Switzerland',
};

/** Seeded demo accounts — password is the same for all: demo123 */
export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'acc-customer-lena',
    email: 'l.brandt@aurelia-naturkosmetik.de',
    password: DEMO_PASSWORD,
    role: 'customer',
    name: 'Lena Brandt',
    company: 'Aurelia Naturkosmetik GmbH',
    jobTitle: 'Head of Product',
    address: aureliaAddress,
  },
  {
    id: 'acc-customer-markus',
    email: 'm.weber@nordlicht-beauty.de',
    password: DEMO_PASSWORD,
    role: 'customer',
    name: 'Markus Weber',
    company: 'Nordlicht Beauty AG',
    jobTitle: 'Sourcing Manager',
    address: nordlichtAddress,
  },
  {
    id: 'acc-admin-jonas',
    email: 'j.keller@labtree.de',
    password: DEMO_PASSWORD,
    role: 'admin',
    name: 'Jonas Keller',
    company: 'Labtree GmbH',
    jobTitle: 'Sourcing & Development',
    address: {
      name: 'Jonas Keller',
      company: 'Labtree GmbH',
      street: 'Schanzenstraße 70',
      zip: '20357',
      city: 'Hamburg',
      country: 'Germany',
    },
  },
];

export const agency = {
  name: 'Labtree GmbH',
  contactName: 'Jonas Keller',
  email: 'sourcing@labtree.de',
  signature: 'Jonas Keller\nSourcing & Development\nLabtree GmbH',
};

/** @deprecated use account from store — kept for seed brief defaults */
export const customer = {
  name: SEED_ACCOUNTS[0].name,
  role: SEED_ACCOUNTS[0].jobTitle,
  company: SEED_ACCOUNTS[0].company,
  email: SEED_ACCOUNTS[0].email,
  address: SEED_ACCOUNTS[0].address,
};
