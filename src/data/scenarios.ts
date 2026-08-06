import type {
  Brief,
  Category,
  Certification,
  LabelType,
  SubCategory,
} from '@/types';

/**
 * Scripted intelligence for the mock AI provider. Everything the assistant
 * "understands" is defined here so it can be tuned by hand before a demo.
 */

export interface QuickReply {
  label: string;
  value: string;
}

export const SEARCH_STEPS = [
  'Applying filters',
  'Semantic search across the catalog',
  'Scoring against brief criteria',
  'Ranking results',
];

export const CATALOG_SIZE_CLAIM = 2847;

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Face care': ['face', 'facial', 'gesicht', 'nose', 'nasal', 'cheek', 'lip', 'eye', 'wrinkle'],
  'Body care': ['body', 'körper', 'hand', 'foot', 'feet', 'leg', 'shower', 'deodorant', 'scrub'],
  'Hair care': ['hair', 'shampoo', 'conditioner', 'scalp', 'haar'],
  'Sun care': ['sun', 'spf', 'sunscreen', 'uv', 'sonnen', 'after-sun', 'tanning'],
  'Special care': ['medical', 'wound', 'scar', 'post-procedure', 'atopic', 'laser', 'pdrn', 'clinical'],
};

const SUB_KEYWORDS: Record<SubCategory, string[]> = {
  Cream: ['cream', 'creme', 'crème'],
  Serum: ['serum', 'ampoule'],
  Balm: ['balm', 'balsam', 'butter'],
  Lotion: ['lotion', 'milk', 'fluid'],
  Gel: ['gel'],
  Oil: ['oil', 'öl'],
  Stick: ['stick'],
  Shampoo: ['shampoo'],
  Mask: ['mask', 'maske'],
  Foam: ['foam', 'mousse'],
};

const AREA_KEYWORDS: Record<string, string[]> = {
  Nose: ['nose', 'nasal', 'nasen'],
  Face: ['face', 'facial', 'gesicht'],
  Lips: ['lip', 'lippen'],
  Cheeks: ['cheek', 'wangen'],
  Eyes: ['eye', 'augen'],
  Hands: ['hand', 'hände'],
  Feet: ['foot', 'feet', 'füße'],
  Legs: ['leg', 'beine'],
  Body: ['body', 'körper'],
  Scalp: ['scalp', 'kopfhaut'],
  Hair: ['hair', 'haar'],
};

const INGREDIENT_KEYWORDS: Record<string, string[]> = {
  Panthenol: ['panthenol', 'dexpanthenol', 'provitamin b5', 'b5'],
  'Hyaluronic acid': ['hyaluron', 'hyaluronic', 'hyaluronsäure'],
  'Shea butter': ['shea', 'sheabutter'],
  Niacinamide: ['niacinamide', 'vitamin b3'],
  Squalane: ['squalane', 'squalan'],
  'Aloe vera': ['aloe'],
  Urea: ['urea', 'harnstoff'],
  Ceramides: ['ceramide', 'ceramides'],
  Retinol: ['retinol'],
  Peptides: ['peptide', 'peptides'],
  Caffeine: ['caffeine', 'koffein'],
  'Salicylic acid': ['salicylic', 'bha'],
  'Argan oil': ['argan'],
  'Jojoba oil': ['jojoba'],
  Bisabolol: ['bisabolol'],
  Allantoin: ['allantoin'],
  Glycerin: ['glycerin', 'glycerol'],
  Collagen: ['collagen', 'kollagen'],
  PDRN: ['pdrn'],
  Ectoin: ['ectoin', 'ectoine'],
  Biotin: ['biotin'],
  Keratin: ['keratin'],
  Menthol: ['menthol'],
  Camphor: ['camphor', 'kampfer'],
  Calendula: ['calendula', 'marigold', 'ringelblume'],
  Chamomile: ['chamomile', 'kamille'],
  'Vitamin C': ['vitamin c', 'ascorb'],
  'Lactic acid': ['lactic', 'milchsäure'],
  Bakuchiol: ['bakuchiol'],
  'Zinc oxide': ['zinc oxide', 'zinkoxid'],
  'Titanium dioxide': ['titanium dioxide', 'titandioxid'],
  'Vitamin E': ['vitamin e', 'tocopherol'],
  'Green tea': ['green tea', 'grüntee'],
  'Rosehip oil': ['rosehip', 'hagebutte'],
  'Sea buckthorn oil': ['sea buckthorn', 'sanddorn'],
};

const CERT_KEYWORDS: Record<Certification, string[]> = {
  vegan: ['vegan'],
  cruelty_free: ['cruelty', 'cruelty-free', 'tierversuchsfrei'],
  organic_cosmos: ['cosmos', 'organic', 'bio-zertifi', 'natrue'],
  derm_tested: ['dermatolog', 'derm-tested', 'derm tested', 'hautverträglich'],
  halal: ['halal'],
  fragrance_free: ['fragrance-free', 'fragrance free', 'parfümfrei', 'unscented', 'without fragrance'],
};

const LABEL_KEYWORDS: Record<LabelType, string[]> = {
  white_label: ['white label', 'white-label', 'whitelabel', 'standard formulation'],
  private_label: ['private label', 'private-label', 'privatelabel', 'own development', 'exclusive'],
};

export const OUT_OF_SCOPE_KEYWORDS = [
  'car',
  'insurance',
  'software',
  'pizza',
  'crypto',
  'flight',
  'laptop',
  'furniture',
  'football',
];

/** Special-case ingredient shortcut: mineral filters are requested as a pair. */
const MINERAL_FILTER_KEYWORDS = ['mineral filter', 'mineral uv', 'mineralisch', 'physical filter'];

function matchAny(haystack: string, needles: string[]) {
  return needles.some((n) => haystack.includes(n));
}

/** Whole-word matching only — "car" must not fire inside "Face care". */
export function isOutOfScope(text: string) {
  const t = text.toLowerCase();
  return OUT_OF_SCOPE_KEYWORDS.some((k) => new RegExp(`\\b${k}s?\\b`).test(t));
}

/** Pulls every structured field it can find out of a free-text message. */
export function extractBriefPatch(text: string): Partial<Brief> {
  const t = ` ${text.toLowerCase()} `;
  const patch: Partial<Brief> = {};

  const volume = t.match(/(\d{1,4})\s*(ml|milliliter)/);
  if (volume) patch.volumeMl = Number(volume[1]);

  const quantity = t.match(/(\d[\d.,']*)\s*(units?|pcs|pieces|stück|stk)/);
  if (quantity) {
    const parsed = Number(quantity[1].replace(/[.,']/g, ''));
    if (!Number.isNaN(parsed)) patch.quantity = parsed;
  }

  const priceRange = t.match(/(\d+[.,]?\d*)\s*(?:-|–|to|bis)\s*(\d+[.,]?\d*)\s*(?:€|eur)/);
  if (priceRange) {
    patch.targetPriceMin = Number(priceRange[1].replace(',', '.'));
    patch.targetPriceMax = Number(priceRange[2].replace(',', '.'));
  } else {
    const maxPrice = t.match(/(?:max\.?|under|below|bis)\s*(\d+[.,]?\d*)\s*(?:€|eur)/);
    if (maxPrice) {
      patch.targetPriceMax = Number(maxPrice[1].replace(',', '.'));
      patch.targetPriceMin = 0;
    }
  }

  const areas = Object.entries(AREA_KEYWORDS)
    .filter(([, keys]) => matchAny(t, keys))
    .map(([area]) => area);
  if (areas.length) patch.applicationArea = areas;

  const sub = (Object.entries(SUB_KEYWORDS) as [SubCategory, string[]][]).find(([, keys]) =>
    matchAny(t, keys),
  );
  if (sub) patch.subCategory = sub[0];

  // An explicit category name always wins over keyword inference — quick-reply
  // chips send the canonical name.
  const explicitCategory = (Object.keys(CATEGORY_KEYWORDS) as Category[]).find((c) =>
    t.includes(c.toLowerCase()),
  );
  const category = (Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]).find(([, keys]) =>
    matchAny(t, keys),
  );
  if (explicitCategory) patch.category = explicitCategory;
  else if (category) patch.category = category[0];

  const ingredients = Object.entries(INGREDIENT_KEYWORDS)
    .filter(([, keys]) => matchAny(t, keys))
    .map(([name]) => name);
  if (matchAny(t, MINERAL_FILTER_KEYWORDS)) {
    ingredients.push('Zinc oxide', 'Titanium dioxide');
  }
  if (ingredients.length) patch.keyIngredients = [...new Set(ingredients)];

  const certs = (Object.entries(CERT_KEYWORDS) as [Certification, string[]][])
    .filter(([, keys]) => matchAny(t, keys))
    .map(([cert]) => cert);
  if (certs.length) patch.certifications = certs;

  const label = (Object.entries(LABEL_KEYWORDS) as [LabelType, string[]][]).find(([, keys]) =>
    matchAny(t, keys),
  );
  if (label) patch.labelType = label[0];

  if (/spf\s*50|lsf\s*50/.test(t)) {
    patch.notes = 'SPF 50, broad-spectrum UVA/UVB';
  }

  return patch;
}

export interface Question {
  id: string;
  /** Which brief field this question fills. */
  field: keyof Brief | 'price';
  prompt: string;
  hint?: string;
  quickReplies: QuickReply[];
  multiSelect?: boolean;
  /** Only asked when this returns true. */
  when?: (brief: Brief) => boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: 'disambiguate-nose',
    field: 'category',
    prompt:
      'Two directions are possible here. Do you mean a nourishing face cream that also covers the nose area, or a medical nose balm in the derma segment?',
    hint: 'The answer determines which manufacturers are relevant.',
    quickReplies: [
      { label: 'Nourishing face cream', value: 'Face care face cream' },
      { label: 'Medical nose balm', value: 'Special care medical nose balm' },
    ],
    when: (brief) =>
      !!brief.applicationArea?.includes('Nose') &&
      (brief.category === 'Face care' || brief.category === null),
  },
  {
    id: 'category',
    field: 'category',
    prompt: 'Which product category are we talking about?',
    quickReplies: [
      { label: 'Face care', value: 'Face care' },
      { label: 'Body care', value: 'Body care' },
      { label: 'Hair care', value: 'Hair care' },
      { label: 'Sun care', value: 'Sun care' },
      { label: 'Special care', value: 'Special care' },
    ],
  },
  {
    id: 'subCategory',
    field: 'subCategory',
    prompt: 'Which texture should the product have?',
    quickReplies: [
      { label: 'Cream', value: 'Cream' },
      { label: 'Serum', value: 'Serum' },
      { label: 'Balm', value: 'Balm' },
      { label: 'Lotion', value: 'Lotion' },
      { label: 'Gel', value: 'Gel' },
      { label: 'Oil', value: 'Oil' },
    ],
  },
  {
    id: 'volume',
    field: 'volumeMl',
    prompt: 'What fill volume do you need?',
    hint: 'Fill volume drives packaging availability and unit cost.',
    quickReplies: [
      { label: '50 ml', value: '50 ml' },
      { label: '100 ml', value: '100 ml' },
      { label: '200 ml', value: '200 ml' },
      { label: '250 ml', value: '250 ml' },
    ],
  },
  {
    id: 'ingredients',
    field: 'keyIngredients',
    prompt: 'Which actives should be declarable on the front label?',
    hint: 'Multiple selections possible.',
    multiSelect: true,
    quickReplies: [
      { label: 'Panthenol', value: 'Panthenol' },
      { label: 'Hyaluronic acid', value: 'Hyaluronic acid' },
      { label: 'Shea butter', value: 'Shea butter' },
      { label: 'Niacinamide', value: 'Niacinamide' },
      { label: 'Ceramides', value: 'Ceramides' },
      { label: 'Not decided yet', value: '__skip__' },
    ],
  },
  {
    id: 'certifications',
    field: 'certifications',
    prompt: 'Which certifications are mandatory?',
    hint: 'Multiple selections possible. Certifications are a hard criterion in the matching.',
    multiSelect: true,
    quickReplies: [
      { label: 'Vegan', value: 'vegan' },
      { label: 'Cruelty-free', value: 'cruelty free' },
      { label: 'Organic COSMOS', value: 'cosmos organic' },
      { label: 'Derm. tested', value: 'dermatologically tested' },
      { label: 'Fragrance-free', value: 'fragrance-free' },
      { label: 'None required', value: '__skip__' },
    ],
  },
  {
    id: 'labelType',
    field: 'labelType',
    prompt:
      'White label or private label? White label means a tested standard formulation under your brand — fastest route to market. Private label is a new development to your specification.',
    quickReplies: [
      { label: 'White label', value: 'white label' },
      { label: 'Private label', value: 'private label' },
      { label: 'Both are fine', value: 'white label' },
    ],
  },
  {
    id: 'quantity',
    field: 'quantity',
    prompt: 'What launch quantity are you planning?',
    hint: 'The quantity decides which manufacturers can produce at all (MOQ).',
    quickReplies: [
      { label: '500 units', value: '500 units' },
      { label: '1,000 units', value: '1000 units' },
      { label: '2,500 units', value: '2500 units' },
      { label: '5,000 units', value: '5000 units' },
    ],
  },
  {
    id: 'price',
    field: 'price',
    prompt: 'What is your target unit price?',
    quickReplies: [
      { label: '2–3 €', value: '2 - 3 €' },
      { label: '3–5 €', value: '3 - 5 €' },
      { label: '5–8 €', value: '5 - 8 €' },
      { label: 'Open for now', value: '0 - 99 €' },
    ],
  },
];

export function isFieldFilled(brief: Brief, question: Question) {
  if (question.field === 'price') {
    return brief.targetPriceMin != null || brief.targetPriceMax != null;
  }
  const value = brief[question.field as keyof Brief];
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

export function nextQuestion(brief: Brief, askedIds: string[]): Question | null {
  for (const question of QUESTIONS) {
    if (askedIds.includes(question.id)) continue;
    if (question.when && !question.when(brief)) continue;
    if (question.when) return question;
    if (!isFieldFilled(brief, question)) return question;
  }
  return null;
}

/** Scenario D: the "uploaded RFQ" that gets extracted in one shot. */
export const PDF_BRIEF = {
  fileName: 'RFQ_Aurelia_Bodyline_2026.pdf',
  raw: 'RFQ Aurelia Naturkosmetik — Bodyline 2026: nourishing body lotion, 250 ml, shea butter and panthenol, vegan and COSMOS organic, private label, 5,000 units, target price 2.20–3.00 € per unit.',
  patch: {
    category: 'Body care' as Category,
    subCategory: 'Lotion' as SubCategory,
    applicationArea: ['Body'],
    volumeMl: 250,
    keyIngredients: ['Shea butter', 'Panthenol'],
    certifications: ['vegan', 'organic_cosmos'] as Certification[],
    labelType: 'private_label' as LabelType,
    quantity: 5000,
    targetPriceMin: 2.2,
    targetPriceMax: 3.0,
    notes: 'Launch Q3 2026, packaging: recycled PET bottle with pump',
  },
  confidence: {
    category: 97,
    subCategory: 95,
    applicationArea: 92,
    volumeMl: 99,
    keyIngredients: 88,
    certifications: 94,
    labelType: 71,
    quantity: 96,
    targetPriceMin: 84,
    targetPriceMax: 84,
    notes: 63,
  },
};

/** One-click scenario starters for the presenter. */
export const STARTER_PROMPTS = [
  {
    label: 'Face cream for the nose, 100 ml',
    value: 'I need a cream for the nose, 100 ml',
    hint: 'Scenario A — catalog hits',
  },
  {
    label: 'Body lotion 250 ml, vegan + organic',
    value:
      'We are looking for a nourishing body lotion, 250 ml, with shea butter, vegan and COSMOS organic, 1000 units, 2 - 3 €',
    hint: 'Scenario B — partial matches',
  },
  {
    label: 'Mineral sunscreen SPF 50, 200 ml',
    value:
      'I need a sunscreen SPF 50 with mineral filter, 200 ml, COSMOS organic, 1000 units, 3 - 5 €',
    hint: 'Scenario C — nothing in catalog',
  },
];
