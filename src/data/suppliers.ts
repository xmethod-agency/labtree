import type { Supplier } from '@/types';

/**
 * 12 manufacturers. Hand-editable during demo prep.
 * `specialties` values must match Product.category values so the sourcing
 * pre-selection can reason about category overlap.
 */
export const suppliers: Supplier[] = [
  {
    id: 'SUP-01',
    name: 'Kosmetik Werke Rhein GmbH',
    country: 'DE',
    contactEmail: 'angebote@kw-rhein.de',
    specialties: ['Face care', 'Special care'],
    avgResponseDays: 2,
    reliabilityScore: 92,
    productCount: 9,
  },
  {
    id: 'SUP-02',
    name: 'Bergmann Dermaceuticals AG',
    country: 'DE',
    contactEmail: 'b2b@bergmann-derma.de',
    specialties: ['Face care', 'Special care'],
    avgResponseDays: 3,
    reliabilityScore: 88,
    productCount: 8,
  },
  {
    id: 'SUP-03',
    name: 'Nordwind Naturkosmetik GmbH',
    country: 'DE',
    contactEmail: 'kontakt@nordwind-natur.de',
    specialties: ['Body care', 'Face care'],
    avgResponseDays: 4,
    reliabilityScore: 84,
    productCount: 7,
  },
  {
    id: 'SUP-04',
    name: 'Elbe Fill & Pack GmbH',
    country: 'DE',
    contactEmail: 'sales@elbe-fillpack.de',
    specialties: ['Body care', 'Hair care'],
    avgResponseDays: 2,
    reliabilityScore: 79,
    productCount: 7,
  },
  {
    id: 'SUP-05',
    name: 'Lombardia Cosmetici S.r.l.',
    country: 'IT',
    contactEmail: 'export@lombardia-cosmetici.it',
    specialties: ['Face care', 'Special care'],
    avgResponseDays: 3,
    reliabilityScore: 90,
    productCount: 6,
  },
  {
    id: 'SUP-06',
    name: 'Aurora Solari S.p.A.',
    country: 'IT',
    contactEmail: 'offerte@aurorasolari.it',
    specialties: ['Sun care'],
    avgResponseDays: 5,
    reliabilityScore: 76,
    productCount: 5,
  },
  {
    id: 'SUP-07',
    name: 'Vistula Cosmetic Labs Sp. z o.o.',
    country: 'PL',
    contactEmail: 'offers@vistula-labs.pl',
    specialties: ['Body care', 'Hair care'],
    avgResponseDays: 2,
    reliabilityScore: 82,
    productCount: 8,
  },
  {
    id: 'SUP-08',
    name: 'Laboratoire Provence Naturel SAS',
    country: 'FR',
    contactEmail: 'devis@provence-naturel.fr',
    specialties: ['Face care', 'Body care'],
    avgResponseDays: 6,
    reliabilityScore: 87,
    productCount: 6,
  },
  {
    id: 'SUP-09',
    name: 'Maison Dermique SAS',
    country: 'FR',
    contactEmail: 'contact@maison-dermique.fr',
    specialties: ['Special care', 'Face care'],
    avgResponseDays: 4,
    reliabilityScore: 91,
    productCount: 6,
  },
  {
    id: 'SUP-10',
    name: 'Ibérica BioCosmética S.L.',
    country: 'ES',
    contactEmail: 'comercial@iberica-biocosmetica.es',
    specialties: ['Sun care', 'Body care'],
    avgResponseDays: 5,
    reliabilityScore: 74,
    productCount: 6,
  },
  {
    id: 'SUP-11',
    name: 'Alpenlab Kosmetik GmbH',
    country: 'AT',
    contactEmail: 'anfragen@alpenlab.at',
    specialties: ['Hair care', 'Body care'],
    avgResponseDays: 3,
    reliabilityScore: 85,
    productCount: 7,
  },
  {
    id: 'SUP-12',
    name: 'Helvetia Formulations AG',
    country: 'CH',
    contactEmail: 'projects@helvetia-formulations.ch',
    specialties: ['Special care', 'Face care'],
    avgResponseDays: 7,
    reliabilityScore: 94,
    productCount: 5,
  },
];

export const supplierById = (id: string) => suppliers.find((s) => s.id === id);

/** Customers never see manufacturer names — only an anonymised label. */
export const supplierAlias = (id: string) => {
  const index = suppliers.findIndex((s) => s.id === id);
  const supplier = suppliers[index];
  if (!supplier) return 'Manufacturer';
  return `Manufacturer #${index + 1} (${supplier.country})`;
};
