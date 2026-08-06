import type { Brief, Certification, LabelType, ReplyKind, Supplier } from '@/types';
import { CERTIFICATION_LABEL, INCI } from '@/data/products';
import { agency } from '@/data/customer';
import { personaFor } from '@/data/personas';
import { formatNumber } from '@/lib/utils';

const BRAND_WORD: Record<string, string> = {
  'SUP-01': 'Rhenus',
  'SUP-02': 'Dermaxa',
  'SUP-03': 'Nordica',
  'SUP-04': 'Elbeline',
  'SUP-05': 'Lombarda',
  'SUP-06': 'Solaris',
  'SUP-07': 'Vistula',
  'SUP-08': 'Provence',
  'SUP-09': 'Dermique',
  'SUP-10': 'Iberia',
  'SUP-11': 'Alpina',
  'SUP-12': 'Helvetica',
};

const STANDARD_VOLUMES = [15, 30, 50, 75, 100, 150, 200, 250, 300, 500];
const MOQ_TIERS = [500, 1000, 1500, 2000, 2500, 3000];

export interface OfferDraft {
  productName: string;
  volumeMl: number;
  keyIngredients: string[];
  certifications: Certification[];
  priceMin: number;
  priceMax: number;
  moq: number;
  leadTimeWeeks: number;
  labelTypes: LabelType[];
  inciExcerpt: string;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Stable pseudo-random per supplier, so numbers differ but never jump around. */
function seed(id: string) {
  let h = 7;
  for (const char of id) h = (h * 31 + char.charCodeAt(0)) % 100000;
  return h;
}

function nearestStandardVolume(value: number) {
  return STANDARD_VOLUMES.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
  );
}

function productName(brief: Brief, supplier: Supplier) {
  const brand = BRAND_WORD[supplier.id] ?? 'Labline';
  const ing = brief.keyIngredients ?? [];
  const mineral = ing.includes('Zinc oxide') || ing.includes('Titanium dioxide');
  const organic = brief.certifications?.includes('organic_cosmos');
  const sub = brief.subCategory ?? 'Cream';
  if (mineral) return `${brand} Mineral SPF 50 ${sub}`;
  if (organic) return `${brand} Organic ${ing[0] ?? 'Care'} ${sub}`;
  if (ing[0]) return `${brand} ${ing[0]} ${sub}`;
  return `${brand} ${brief.category ?? 'Care'} ${sub}`;
}

export function buildOffer(brief: Brief, supplier: Supplier, deviation: boolean): OfferDraft {
  const h = seed(supplier.id);
  const ing = brief.keyIngredients?.length ? [...brief.keyIngredients] : ['Glycerin', 'Panthenol'];
  if (!ing.includes('Panthenol') && ing.length < 3) ing.push('Panthenol');

  const targetMax = brief.targetPriceMax ?? 4.5;
  const volume = brief.volumeMl ?? 100;
  const quantity = brief.quantity ?? 1000;

  // Each manufacturer sits at a different point commercially: cheaper but slower,
  // premium but flexible on MOQ, and so on.
  const priceFactor = deviation ? 1.06 + (h % 17) / 100 : 0.84 + (h % 23) / 100;
  const spread = 0.1 + (h % 11) / 100;
  const priceMin = round2(Math.max(0.6, targetMax * priceFactor));

  const moqIndex = deviation ? Math.min(MOQ_TIERS.length - 1, (h % 3) + 3) : h % 4;
  const moq = deviation ? MOQ_TIERS[moqIndex] : Math.min(MOQ_TIERS[moqIndex], Math.max(500, quantity));

  const deviatingVolume = nearestStandardVolume(volume * (h % 2 === 0 ? 0.75 : 1.5));

  return {
    productName: productName(brief, supplier),
    volumeMl: deviation ? deviatingVolume : volume,
    keyIngredients: ing,
    certifications: brief.certifications ?? [],
    priceMin,
    priceMax: round2(priceMin * (1 + spread)),
    moq,
    leadTimeWeeks: deviation ? 9 + (h % 4) : 4 + (h % 6),
    labelTypes: brief.labelType ? [brief.labelType] : ['white_label', 'private_label'],
    inciExcerpt: ['Aqua', 'Glycerin', ...ing.map((i) => INCI[i] ?? i), 'Tocopherol', 'Phenoxyethanol']
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(', '),
  };
}

/** Deviations the persona has to mention explicitly in a deviating offer. */
export function deviationNotes(brief: Brief, offer: OfferDraft) {
  const notes: string[] = [];
  if (brief.volumeMl && offer.volumeMl !== brief.volumeMl) {
    notes.push(
      `fill volume ${offer.volumeMl} ml instead of the requested ${brief.volumeMl} ml (no tooling for ${brief.volumeMl} ml before Q4)`,
    );
  }
  if (brief.quantity && offer.moq > brief.quantity) {
    notes.push(
      `minimum order quantity ${formatNumber(offer.moq)} pieces instead of the requested ${formatNumber(brief.quantity)}`,
    );
  }
  if (brief.targetPriceMax && offer.priceMin > brief.targetPriceMax) {
    notes.push(`price above the target of ${brief.targetPriceMax.toFixed(2)} € per piece`);
  }
  if (!notes.length) notes.push(`lead time ${offer.leadTimeWeeks} weeks`);
  return notes;
}

/** Structured fallback body — used offline and whenever the model call fails. */
export function offerBody(brief: Brief, supplier: Supplier, offer: OfferDraft, deviation: boolean) {
  const persona = personaFor(supplier.id);
  const certs = offer.certifications.map((c) => CERTIFICATION_LABEL[c]).join(', ') || 'on request';
  const labels = offer.labelTypes
    .map((l) => (l === 'white_label' ? 'white label' : 'private label'))
    .join(' and ');

  const intro = deviation
    ? 'thank you for your enquiry. We can supply the product, but not exactly in the requested specification — please find our closest option below.'
    : 'thank you for your enquiry. We are pleased to offer the following product from our current portfolio.';

  const deviationNote = deviation
    ? `\nDeviations from your enquiry: ${deviationNotes(brief, offer).join('; ')}.\n`
    : '';

  return `Dear Mr Keller,

${intro}

Product: ${offer.productName}
Fill volume: ${offer.volumeMl} ml
Actives: ${offer.keyIngredients.join(', ')}
INCI: ${offer.inciExcerpt}
Certifications: ${certs}
Price: ${offer.priceMin.toFixed(2)} - ${offer.priceMax.toFixed(2)} EUR per unit
MOQ: ${formatNumber(offer.moq)} units
Lead time: ${offer.leadTimeWeeks} weeks
Label: ${labels}
${deviationNote}
Stability data and the full INCI declaration are attached. Samples can be shipped within 5 working days.

Kind regards
${persona.name}
${persona.role}
${supplier.name}`;
}

export function declineBody(brief: Brief, supplier: Supplier) {
  const persona = personaFor(supplier.id);
  return `Dear Mr Keller,

thank you for your enquiry regarding a ${brief.subCategory?.toLowerCase() ?? 'product'} in ${brief.volumeMl ?? '—'} ml.

Unfortunately we cannot offer this product at the moment. The required specification is outside our current formulation portfolio and our development capacity is fully booked until Q4.

We will gladly review a follow-up enquiry next quarter.

Kind regards
${persona.name}
${persona.role}
${supplier.name}`;
}

export function holdingBody(supplier: Supplier) {
  const persona = personaFor(supplier.id);
  return `Dear Mr Keller,

thank you for the reminder. Your enquiry is with our formulation team; we expect to send a technical quotation next week.

Kind regards
${persona.name}
${supplier.name}`;
}

export function followUpBody(brief: Brief) {
  return `Dear Sir or Madam,

we would like to follow up on our enquiry from earlier today regarding a ${
    brief.subCategory?.toLowerCase() ?? 'product'
  }, ${brief.volumeMl ?? '—'} ml (reference ${brief.id}).

Could you let us know whether you can offer this product? A short feasibility statement would already help us.

Kind regards
${agency.signature}`;
}

/** Reply mix per sourcing run: 2 offers, 1 deviating offer, 1 decline, 1 silent. */
export const REPLY_MIX: ReplyKind[] = ['offer', 'offer', 'offer_deviation', 'decline', 'silent'];

/** Compressed to seconds so a live demo never stalls. */
export function replyDelayFor(supplier: Supplier) {
  return 4000 + supplier.avgResponseDays * 1200;
}

export function attachmentFor(offer: OfferDraft) {
  const slug = offer.productName.replace(/[^A-Za-z0-9]+/g, '_');
  return `Datasheet_${slug}.pdf`;
}
