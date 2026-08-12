import type { Category, Certification, LabelType, Product, SubCategory } from '@/types';

/** Marketing ingredient name -> INCI name, used to build realistic INCI excerpts. */
export const INCI: Record<string, string> = {
  Panthenol: 'Panthenol',
  'Hyaluronic acid': 'Sodium Hyaluronate',
  'Shea butter': 'Butyrospermum Parkii Butter',
  Niacinamide: 'Niacinamide',
  Squalane: 'Squalane',
  'Aloe vera': 'Aloe Barbadensis Leaf Juice',
  'Zinc oxide': 'Zinc Oxide',
  'Titanium dioxide': 'Titanium Dioxide',
  Urea: 'Urea',
  Ceramides: 'Ceramide NP',
  'Vitamin E': 'Tocopherol',
  Retinol: 'Retinol',
  Peptides: 'Palmitoyl Tripeptide-1',
  Caffeine: 'Caffeine',
  'Salicylic acid': 'Salicylic Acid',
  'Argan oil': 'Argania Spinosa Kernel Oil',
  'Jojoba oil': 'Simmondsia Chinensis Seed Oil',
  Bisabolol: 'Bisabolol',
  Allantoin: 'Allantoin',
  Glycerin: 'Glycerin',
  Collagen: 'Hydrolyzed Collagen',
  PDRN: 'Polydeoxyribonucleotide',
  Ectoin: 'Ectoine',
  Biotin: 'Biotin',
  Keratin: 'Hydrolyzed Keratin',
  Menthol: 'Menthol',
  Camphor: 'Camphor',
  Calendula: 'Calendula Officinalis Flower Extract',
  Chamomile: 'Chamomilla Recutita Flower Extract',
  'Vitamin C': 'Ascorbyl Glucoside',
  'Lactic acid': 'Lactic Acid',
  Bakuchiol: 'Bakuchiol',
  Beeswax: 'Cera Alba',
  Lanolin: 'Lanolin',
  'Sea buckthorn oil': 'Hippophae Rhamnoides Fruit Oil',
  'Green tea': 'Camellia Sinensis Leaf Extract',
  'Rosehip oil': 'Rosa Canina Fruit Oil',
  'Chemical UV filters': 'Ethylhexyl Methoxycinnamate, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine',
  'Mineral UV filter': 'Zinc Oxide, Titanium Dioxide',
};

export const CERTIFICATION_LABEL: Record<Certification, string> = {
  vegan: 'Vegan',
  cruelty_free: 'Cruelty-free',
  organic_cosmos: 'Organic COSMOS',
  derm_tested: 'Derm. tested',
  halal: 'Halal',
  fragrance_free: 'Fragrance-free',
};

export const LABEL_TYPE_LABEL: Record<LabelType, string> = {
  white_label: 'White label',
  private_label: 'Private label',
};

const WL: LabelType[] = ['white_label'];
const PL: LabelType[] = ['private_label'];
const BOTH: LabelType[] = ['white_label', 'private_label'];

interface Seed {
  id: string;
  s: string;
  name: string;
  cat: Category;
  sub: SubCategory;
  area: string[];
  ml: number;
  ing: string[];
  cert: Certification[];
  label: LabelType[];
  price: [number, number];
  moq: number;
  lead: number;
  noSample?: boolean;
}

function inciFor(ing: string[]) {
  const mapped = ing.map((i) => INCI[i] ?? i);
  return ['Aqua', 'Glycerin', ...mapped.filter((m) => m !== 'Glycerin'), 'Tocopherol', 'Phenoxyethanol']
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(', ');
}

function describe(seed: Seed) {
  const areas = seed.area.join(', ').toLowerCase();
  const certs = seed.cert.map((c) => CERTIFICATION_LABEL[c]).join(', ');
  const labels = seed.label.map((l) => LABEL_TYPE_LABEL[l]).join(' and ');
  const first = `${seed.ing[0]}-led ${seed.sub.toLowerCase()} formulation in a ${seed.ml} ml fill, developed for ${areas}.`;
  const second = `Stable, reproducible batch quality with ${seed.ing.slice(0, 3).join(', ')} as declared actives.`;
  const third = certs
    ? `Available as ${labels}; certified ${certs}.`
    : `Available as ${labels}; no third-party certification on file.`;
  return `${first} ${second} ${third}`;
}

const seeds: Seed[] = [
  // SUP-01 Kosmetik Werke Rhein GmbH
  { id: 'KWR-FC-0412', s: 'SUP-01', name: 'Regenerating Face Cream with Panthenol', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose', 'Cheeks'], ml: 100, ing: ['Panthenol', 'Shea butter', 'Vitamin E'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.2, 4.1], moq: 500, lead: 6 },
  { id: 'KWR-FC-0418', s: 'SUP-01', name: 'Barrier Repair Cream Panthenol 5%', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose'], ml: 100, ing: ['Panthenol', 'Ceramides', 'Glycerin'], cert: ['vegan', 'fragrance_free', 'derm_tested'], label: BOTH, price: [3.9, 4.8], moq: 1000, lead: 5 },
  { id: 'KWR-FC-0507', s: 'SUP-01', name: 'Soothing Nose & Lip Care Cream', cat: 'Face care', sub: 'Cream', area: ['Nose', 'Lips', 'Face'], ml: 100, ing: ['Panthenol', 'Bisabolol', 'Allantoin'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [2.9, 3.6], moq: 250, lead: 4 },
  { id: 'KWR-FC-0388', s: 'SUP-01', name: 'Rich Recovery Cream', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose'], ml: 50, ing: ['Panthenol', 'Shea butter', 'Allantoin'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [2.4, 3.1], moq: 500, lead: 5 },
  { id: 'KWR-FC-0361', s: 'SUP-01', name: 'Classic Nourishing Night Cream', cat: 'Face care', sub: 'Cream', area: ['Face'], ml: 100, ing: ['Panthenol', 'Beeswax', 'Lanolin'], cert: ['derm_tested'], label: WL, price: [2.6, 3.4], moq: 500, lead: 5 },
  { id: 'KWR-SP-0122', s: 'SUP-01', name: 'Intensive Hand Repair Balm', cat: 'Special care', sub: 'Balm', area: ['Hands'], ml: 75, ing: ['Urea', 'Panthenol', 'Shea butter'], cert: ['vegan'], label: BOTH, price: [2.1, 2.8], moq: 1000, lead: 4 },
  { id: 'KWR-FC-0442', s: 'SUP-01', name: 'Hyaluronic Boost Serum', cat: 'Face care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Hyaluronic acid', 'Niacinamide'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [4.6, 5.9], moq: 500, lead: 6 },
  { id: 'KWR-SP-0134', s: 'SUP-01', name: 'Cracked Heel Intensive Cream', cat: 'Special care', sub: 'Cream', area: ['Feet'], ml: 100, ing: ['Urea', 'Allantoin'], cert: ['vegan', 'derm_tested'], label: WL, price: [2.3, 2.9], moq: 1000, lead: 5 },
  { id: 'KWR-FC-0455', s: 'SUP-01', name: 'Light Daily Moisturiser', cat: 'Face care', sub: 'Lotion', area: ['Face'], ml: 50, ing: ['Glycerin', 'Squalane'], cert: ['vegan'], label: BOTH, price: [2.2, 2.9], moq: 500, lead: 4, noSample: true },

  // SUP-02 Bergmann Dermaceuticals AG
  { id: 'BDM-FC-1103', s: 'SUP-02', name: 'Dermatological Face Cream Panthenol', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose'], ml: 100, ing: ['Panthenol', 'Niacinamide', 'Ceramides'], cert: ['vegan', 'derm_tested', 'fragrance_free'], label: BOTH, price: [4.4, 5.3], moq: 1000, lead: 7 },
  { id: 'BDM-SP-1140', s: 'SUP-02', name: 'Post-Procedure Repair Gel', cat: 'Special care', sub: 'Gel', area: ['Face', 'Body'], ml: 50, ing: ['Panthenol', 'Aloe vera'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.8, 4.6], moq: 500, lead: 6 },
  { id: 'BDM-FC-1121', s: 'SUP-02', name: 'Retinol Renewal Night Cream', cat: 'Face care', sub: 'Cream', area: ['Face'], ml: 50, ing: ['Retinol', 'Squalane', 'Vitamin E'], cert: ['vegan', 'cruelty_free'], label: PL, price: [5.6, 6.9], moq: 1000, lead: 8 },
  { id: 'BDM-FC-1088', s: 'SUP-02', name: 'Redness Relief Cream', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose', 'Cheeks'], ml: 75, ing: ['Bisabolol', 'Panthenol', 'Chamomile'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.4, 4.2], moq: 500, lead: 6 },
  { id: 'BDM-SP-1155', s: 'SUP-02', name: 'Medical Nose Balm', cat: 'Special care', sub: 'Balm', area: ['Nose'], ml: 25, ing: ['Panthenol', 'Beeswax', 'Jojoba oil'], cert: ['derm_tested'], label: WL, price: [1.9, 2.4], moq: 1000, lead: 4 },
  { id: 'BDM-FC-1132', s: 'SUP-02', name: 'Niacinamide Pore Serum', cat: 'Face care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Niacinamide', 'Salicylic acid'], cert: ['vegan'], label: BOTH, price: [4.2, 5.1], moq: 500, lead: 6 },
  { id: 'BDM-SP-1167', s: 'SUP-02', name: 'Atopic Skin Body Cream', cat: 'Special care', sub: 'Cream', area: ['Body'], ml: 200, ing: ['Urea', 'Ceramides', 'Panthenol'], cert: ['vegan', 'derm_tested', 'fragrance_free'], label: BOTH, price: [3.6, 4.4], moq: 1000, lead: 6 },
  { id: 'BDM-FC-1149', s: 'SUP-02', name: 'Peptide Eye Cream', cat: 'Face care', sub: 'Cream', area: ['Eyes'], ml: 15, ing: ['Peptides', 'Caffeine'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [4.9, 6.1], moq: 500, lead: 7 },

  // SUP-03 Nordwind Naturkosmetik GmbH
  { id: 'NWN-FC-2201', s: 'SUP-03', name: 'Organic Calendula Face Cream', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose'], ml: 100, ing: ['Calendula', 'Shea butter', 'Panthenol'], cert: ['vegan', 'organic_cosmos', 'cruelty_free'], label: BOTH, price: [4.1, 5.0], moq: 500, lead: 7 },
  { id: 'NWN-BC-2210', s: 'SUP-03', name: 'Organic Shea Body Butter', cat: 'Body care', sub: 'Balm', area: ['Body'], ml: 200, ing: ['Shea butter', 'Vitamin E'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [3.7, 4.5], moq: 500, lead: 6 },
  { id: 'NWN-BC-2218', s: 'SUP-03', name: 'Organic Body Lotion Aloe', cat: 'Body care', sub: 'Lotion', area: ['Body'], ml: 200, ing: ['Aloe vera', 'Shea butter', 'Glycerin'], cert: ['vegan', 'organic_cosmos', 'cruelty_free'], label: BOTH, price: [2.8, 3.5], moq: 1000, lead: 6 },
  { id: 'NWN-BC-2224', s: 'SUP-03', name: 'Sea Buckthorn Body Oil', cat: 'Body care', sub: 'Oil', area: ['Body'], ml: 100, ing: ['Sea buckthorn oil', 'Jojoba oil'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [4.3, 5.2], moq: 250, lead: 5 },
  { id: 'NWN-FC-2233', s: 'SUP-03', name: 'Rosehip Regenerating Serum', cat: 'Face care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Rosehip oil', 'Vitamin C'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [5.1, 6.2], moq: 250, lead: 7 },
  { id: 'NWN-BC-2241', s: 'SUP-03', name: 'Chamomile Hand Lotion', cat: 'Body care', sub: 'Lotion', area: ['Hands'], ml: 150, ing: ['Chamomile', 'Panthenol', 'Glycerin'], cert: ['vegan', 'organic_cosmos'], label: WL, price: [2.4, 3.0], moq: 1000, lead: 5 },
  { id: 'NWN-BC-2249', s: 'SUP-03', name: 'Organic Deodorant Balm', cat: 'Body care', sub: 'Balm', area: ['Underarms'], ml: 50, ing: ['Shea butter', 'Green tea'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [2.6, 3.3], moq: 500, lead: 6 },

  // SUP-04 Elbe Fill & Pack GmbH
  { id: 'EFP-BC-3301', s: 'SUP-04', name: 'Everyday Body Lotion', cat: 'Body care', sub: 'Lotion', area: ['Body'], ml: 250, ing: ['Glycerin', 'Shea butter', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [1.9, 2.5], moq: 2500, lead: 4 },
  { id: 'EFP-BC-3309', s: 'SUP-04', name: 'Shower Gel Fresh', cat: 'Body care', sub: 'Gel', area: ['Body'], ml: 300, ing: ['Aloe vera', 'Glycerin'], cert: ['vegan'], label: WL, price: [1.2, 1.7], moq: 2500, lead: 3 },
  { id: 'EFP-HC-3315', s: 'SUP-04', name: 'Everyday Care Shampoo', cat: 'Hair care', sub: 'Shampoo', area: ['Hair'], ml: 250, ing: ['Panthenol', 'Biotin'], cert: ['vegan'], label: BOTH, price: [1.4, 1.9], moq: 2500, lead: 4 },
  { id: 'EFP-HC-3322', s: 'SUP-04', name: 'Repair Conditioner', cat: 'Hair care', sub: 'Lotion', area: ['Hair'], ml: 200, ing: ['Keratin', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [1.6, 2.1], moq: 2500, lead: 4 },
  { id: 'EFP-BC-3330', s: 'SUP-04', name: 'Hand Wash Foam', cat: 'Body care', sub: 'Foam', area: ['Hands'], ml: 300, ing: ['Glycerin', 'Aloe vera'], cert: ['vegan'], label: WL, price: [1.3, 1.8], moq: 2500, lead: 3, noSample: true },
  { id: 'EFP-BC-3338', s: 'SUP-04', name: 'Cooling Leg Gel', cat: 'Body care', sub: 'Gel', area: ['Legs'], ml: 150, ing: ['Menthol', 'Camphor', 'Aloe vera'], cert: ['vegan'], label: BOTH, price: [2.1, 2.7], moq: 1000, lead: 5 },
  { id: 'EFP-HC-3344', s: 'SUP-04', name: 'Dry Scalp Tonic', cat: 'Hair care', sub: 'Serum', area: ['Scalp'], ml: 100, ing: ['Panthenol', 'Urea'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [2.9, 3.6], moq: 1000, lead: 5 },

  // SUP-05 Lombardia Cosmetici S.r.l.
  { id: 'LMC-FC-4401', s: 'SUP-05', name: 'Velvet Day Cream', cat: 'Face care', sub: 'Cream', area: ['Face'], ml: 50, ing: ['Squalane', 'Vitamin E', 'Glycerin'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [2.9, 3.7], moq: 1000, lead: 6 },
  { id: 'LMC-FC-4408', s: 'SUP-05', name: 'Radiance Serum Base', cat: 'Face care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Niacinamide', 'Peptides'], cert: ['vegan'], label: PL, price: [4.8, 5.9], moq: 1000, lead: 7 },
  { id: 'LMC-FC-4415', s: 'SUP-05', name: 'Lip Repair Balm', cat: 'Face care', sub: 'Balm', area: ['Lips'], ml: 15, ing: ['Shea butter', 'Panthenol', 'Vitamin E'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [1.7, 2.3], moq: 1000, lead: 5 },
  { id: 'LMC-SP-4423', s: 'SUP-05', name: 'Collagen Sheet Mask', cat: 'Special care', sub: 'Mask', area: ['Face'], ml: 25, ing: ['Collagen', 'Hyaluronic acid'], cert: ['vegan', 'halal'], label: BOTH, price: [1.1, 1.6], moq: 2500, lead: 6 },
  { id: 'LMC-FC-4431', s: 'SUP-05', name: 'Matte Control Face Gel', cat: 'Face care', sub: 'Gel', area: ['Face'], ml: 50, ing: ['Salicylic acid', 'Green tea'], cert: ['vegan'], label: BOTH, price: [2.7, 3.4], moq: 1000, lead: 5 },
  { id: 'LMC-FC-4440', s: 'SUP-05', name: 'Rich Face Cream Ceramides', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose'], ml: 100, ing: ['Ceramides', 'Shea butter', 'Glycerin'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.6, 4.5], moq: 1000, lead: 6 },

  // SUP-06 Aurora Solari S.p.A. — sun care, chemical filters only, no COSMOS
  { id: 'AUS-SC-5501', s: 'SUP-06', name: 'Sun Lotion SPF 30', cat: 'Sun care', sub: 'Lotion', area: ['Body'], ml: 150, ing: ['Chemical UV filters', 'Vitamin E'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.1, 3.9], moq: 1000, lead: 7 },
  { id: 'AUS-SC-5508', s: 'SUP-06', name: 'Sun Spray SPF 50', cat: 'Sun care', sub: 'Lotion', area: ['Body'], ml: 200, ing: ['Chemical UV filters', 'Aloe vera'], cert: ['vegan'], label: BOTH, price: [3.6, 4.4], moq: 2500, lead: 8 },
  { id: 'AUS-SC-5514', s: 'SUP-06', name: 'Face Sun Fluid SPF 50', cat: 'Sun care', sub: 'Lotion', area: ['Face'], ml: 50, ing: ['Chemical UV filters', 'Niacinamide'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.9, 4.8], moq: 1000, lead: 7 },
  { id: 'AUS-SC-5520', s: 'SUP-06', name: 'After Sun Gel', cat: 'Sun care', sub: 'Gel', area: ['Body'], ml: 200, ing: ['Aloe vera', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [2.2, 2.8], moq: 1000, lead: 5 },
  { id: 'AUS-SC-5527', s: 'SUP-06', name: 'Sun Stick SPF 50', cat: 'Sun care', sub: 'Stick', area: ['Face'], ml: 15, ing: ['Chemical UV filters', 'Shea butter'], cert: ['vegan'], label: BOTH, price: [2.8, 3.5], moq: 2500, lead: 8 },

  // SUP-07 Vistula Cosmetic Labs
  { id: 'VCL-BC-6601', s: 'SUP-07', name: 'Urea Foot Cream 10%', cat: 'Body care', sub: 'Cream', area: ['Feet'], ml: 100, ing: ['Urea', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [1.8, 2.4], moq: 1000, lead: 4 },
  { id: 'VCL-BC-6609', s: 'SUP-07', name: 'Nourishing Body Lotion Shea', cat: 'Body care', sub: 'Lotion', area: ['Body'], ml: 200, ing: ['Shea butter', 'Glycerin', 'Vitamin E'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [2.1, 2.7], moq: 1000, lead: 5 },
  { id: 'VCL-HC-6615', s: 'SUP-07', name: 'Volume Shampoo Biotin', cat: 'Hair care', sub: 'Shampoo', area: ['Hair'], ml: 300, ing: ['Biotin', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [1.5, 2.0], moq: 2500, lead: 5 },
  { id: 'VCL-HC-6622', s: 'SUP-07', name: 'Argan Hair Oil', cat: 'Hair care', sub: 'Oil', area: ['Hair'], ml: 100, ing: ['Argan oil', 'Vitamin E'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [2.4, 3.1], moq: 1000, lead: 5 },
  { id: 'VCL-BC-6630', s: 'SUP-07', name: 'Firming Body Gel Caffeine', cat: 'Body care', sub: 'Gel', area: ['Body', 'Legs'], ml: 200, ing: ['Caffeine', 'Green tea'], cert: ['vegan'], label: BOTH, price: [2.6, 3.3], moq: 1000, lead: 6 },
  { id: 'VCL-BC-6638', s: 'SUP-07', name: 'Intensive Hand Cream', cat: 'Body care', sub: 'Cream', area: ['Hands'], ml: 75, ing: ['Glycerin', 'Panthenol', 'Shea butter'], cert: ['vegan'], label: BOTH, price: [1.4, 1.9], moq: 2500, lead: 4 },
  { id: 'VCL-HC-6645', s: 'SUP-07', name: 'Colour Protect Conditioner', cat: 'Hair care', sub: 'Lotion', area: ['Hair'], ml: 250, ing: ['Keratin', 'Argan oil'], cert: ['vegan'], label: BOTH, price: [1.7, 2.2], moq: 2500, lead: 5 },
  { id: 'VCL-BC-6653', s: 'SUP-07', name: 'Exfoliating Body Scrub', cat: 'Body care', sub: 'Gel', area: ['Body'], ml: 250, ing: ['Lactic acid', 'Jojoba oil'], cert: ['vegan'], label: BOTH, price: [2.3, 2.9], moq: 1000, lead: 5 },

  // SUP-08 Laboratoire Provence Naturel
  { id: 'LPN-FC-7701', s: 'SUP-08', name: 'Provence Rose Face Cream', cat: 'Face care', sub: 'Cream', area: ['Face'], ml: 50, ing: ['Rosehip oil', 'Shea butter'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [4.4, 5.4], moq: 500, lead: 7 },
  { id: 'LPN-FC-7708', s: 'SUP-08', name: 'Gentle Cleansing Milk', cat: 'Face care', sub: 'Lotion', area: ['Face'], ml: 200, ing: ['Chamomile', 'Glycerin'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [2.7, 3.4], moq: 1000, lead: 6 },
  { id: 'LPN-BC-7716', s: 'SUP-08', name: 'Lavender Body Oil', cat: 'Body care', sub: 'Oil', area: ['Body'], ml: 100, ing: ['Jojoba oil', 'Vitamin E'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [3.8, 4.7], moq: 500, lead: 6 },
  { id: 'LPN-FC-7723', s: 'SUP-08', name: 'Soothing Face Balm Bisabolol', cat: 'Face care', sub: 'Balm', area: ['Face', 'Nose'], ml: 75, ing: ['Bisabolol', 'Panthenol', 'Calendula'], cert: ['vegan', 'organic_cosmos', 'derm_tested'], label: BOTH, price: [4.0, 4.9], moq: 500, lead: 7 },
  { id: 'LPN-BC-7731', s: 'SUP-08', name: 'Hand Cream Calendula', cat: 'Body care', sub: 'Cream', area: ['Hands'], ml: 75, ing: ['Calendula', 'Shea butter'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [2.2, 2.8], moq: 1000, lead: 6 },
  { id: 'LPN-FC-7739', s: 'SUP-08', name: 'Micellar Cleansing Water', cat: 'Face care', sub: 'Lotion', area: ['Face'], ml: 300, ing: ['Glycerin', 'Chamomile'], cert: ['vegan'], label: WL, price: [1.6, 2.1], moq: 2500, lead: 5 },

  // SUP-09 Maison Dermique
  { id: 'MDQ-SP-8801', s: 'SUP-09', name: 'PDRN Peptide Serum', cat: 'Special care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['PDRN', 'Peptides', 'Hyaluronic acid'], cert: ['vegan', 'derm_tested'], label: PL, price: [6.4, 7.8], moq: 1000, lead: 8 },
  { id: 'MDQ-SP-8809', s: 'SUP-09', name: 'Ectoin Barrier Serum', cat: 'Special care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Ectoin', 'Panthenol'], cert: ['vegan', 'derm_tested', 'fragrance_free'], label: BOTH, price: [5.2, 6.3], moq: 500, lead: 7 },
  { id: 'MDQ-FC-8816', s: 'SUP-09', name: 'Bakuchiol Night Cream', cat: 'Face care', sub: 'Cream', area: ['Face'], ml: 50, ing: ['Bakuchiol', 'Squalane'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [4.7, 5.8], moq: 1000, lead: 7 },
  { id: 'MDQ-SP-8824', s: 'SUP-09', name: 'Eyelash Peptide Serum', cat: 'Special care', sub: 'Serum', area: ['Eyes'], ml: 5, ing: ['Peptides', 'Biotin', 'Panthenol'], cert: ['vegan', 'derm_tested'], label: PL, price: [5.9, 7.2], moq: 1000, lead: 8 },
  { id: 'MDQ-FC-8832', s: 'SUP-09', name: 'Vitamin C Glow Serum', cat: 'Face care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Vitamin C', 'Ectoin'], cert: ['vegan'], label: BOTH, price: [5.4, 6.6], moq: 500, lead: 7 },
  { id: 'MDQ-SP-8840', s: 'SUP-09', name: 'Scar Care Gel', cat: 'Special care', sub: 'Gel', area: ['Body', 'Face'], ml: 50, ing: ['Allantoin', 'Panthenol', 'Aloe vera'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [4.1, 5.0], moq: 1000, lead: 6 },

  // SUP-10 Ibérica BioCosmética
  { id: 'IBC-SC-9901', s: 'SUP-10', name: 'Sun Milk SPF 30 Family', cat: 'Sun care', sub: 'Lotion', area: ['Body'], ml: 250, ing: ['Chemical UV filters', 'Aloe vera'], cert: ['vegan'], label: BOTH, price: [2.9, 3.6], moq: 2500, lead: 7 },
  { id: 'IBC-SC-9908', s: 'SUP-10', name: 'Kids Sun Lotion SPF 50', cat: 'Sun care', sub: 'Lotion', area: ['Body'], ml: 150, ing: ['Chemical UV filters', 'Panthenol'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.4, 4.2], moq: 1000, lead: 7 },
  { id: 'IBC-BC-9915', s: 'SUP-10', name: 'Aloe After Sun Lotion', cat: 'Body care', sub: 'Lotion', area: ['Body'], ml: 200, ing: ['Aloe vera', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [2.3, 2.9], moq: 1000, lead: 5 },
  { id: 'IBC-BC-9923', s: 'SUP-10', name: 'Olive Body Cream', cat: 'Body care', sub: 'Cream', area: ['Body'], ml: 200, ing: ['Shea butter', 'Vitamin E', 'Glycerin'], cert: ['vegan', 'halal'], label: BOTH, price: [2.5, 3.2], moq: 1000, lead: 5 },
  { id: 'IBC-SC-9930', s: 'SUP-10', name: 'Tanning Oil SPF 6', cat: 'Sun care', sub: 'Oil', area: ['Body'], ml: 150, ing: ['Chemical UV filters', 'Jojoba oil'], cert: ['vegan'], label: WL, price: [2.6, 3.3], moq: 2500, lead: 6 },
  { id: 'IBC-BC-9938', s: 'SUP-10', name: 'Mineral Body Scrub', cat: 'Body care', sub: 'Gel', area: ['Body'], ml: 250, ing: ['Lactic acid', 'Green tea'], cert: ['vegan'], label: BOTH, price: [2.2, 2.8], moq: 1000, lead: 5 },

  // SUP-11 Alpenlab Kosmetik
  { id: 'ALK-HC-1001', s: 'SUP-11', name: 'Alpine Herbal Shampoo', cat: 'Hair care', sub: 'Shampoo', area: ['Hair'], ml: 250, ing: ['Green tea', 'Panthenol'], cert: ['vegan', 'organic_cosmos'], label: BOTH, price: [1.9, 2.5], moq: 1000, lead: 5 },
  { id: 'ALK-HC-1009', s: 'SUP-11', name: 'Scalp Soothing Serum', cat: 'Hair care', sub: 'Serum', area: ['Scalp'], ml: 50, ing: ['Bisabolol', 'Panthenol'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [3.2, 4.0], moq: 1000, lead: 6 },
  { id: 'ALK-BC-1016', s: 'SUP-11', name: 'Arnica Muscle Gel', cat: 'Body care', sub: 'Gel', area: ['Body'], ml: 200, ing: ['Menthol', 'Camphor'], cert: ['vegan'], label: BOTH, price: [2.4, 3.0], moq: 1000, lead: 5 },
  { id: 'ALK-HC-1024', s: 'SUP-11', name: 'Keratin Hair Mask', cat: 'Hair care', sub: 'Mask', area: ['Hair'], ml: 200, ing: ['Keratin', 'Argan oil', 'Panthenol'], cert: ['vegan'], label: BOTH, price: [2.7, 3.4], moq: 1000, lead: 6 },
  { id: 'ALK-BC-1032', s: 'SUP-11', name: 'Goat Milk Body Lotion', cat: 'Body care', sub: 'Lotion', area: ['Body'], ml: 250, ing: ['Glycerin', 'Vitamin E'], cert: ['derm_tested'], label: WL, price: [2.0, 2.6], moq: 2500, lead: 5 },
  { id: 'ALK-HC-1040', s: 'SUP-11', name: 'Dry Shampoo Foam', cat: 'Hair care', sub: 'Foam', area: ['Hair'], ml: 150, ing: ['Biotin', 'Green tea'], cert: ['vegan'], label: BOTH, price: [2.3, 2.9], moq: 2500, lead: 6, noSample: true },
  { id: 'ALK-BC-1048', s: 'SUP-11', name: 'Foot Balm Peppermint', cat: 'Body care', sub: 'Balm', area: ['Feet'], ml: 75, ing: ['Menthol', 'Urea', 'Shea butter'], cert: ['vegan'], label: BOTH, price: [1.9, 2.4], moq: 1000, lead: 4 },

  // SUP-12 Helvetia Formulations
  { id: 'HVF-FC-1101', s: 'SUP-12', name: 'Swiss Cellular Repair Cream', cat: 'Face care', sub: 'Cream', area: ['Face'], ml: 50, ing: ['Peptides', 'Ceramides', 'Squalane'], cert: ['vegan', 'derm_tested', 'cruelty_free'], label: PL, price: [7.9, 9.6], moq: 500, lead: 9 },
  { id: 'HVF-SP-1109', s: 'SUP-12', name: 'Regenerating Overnight Mask', cat: 'Special care', sub: 'Mask', area: ['Face'], ml: 75, ing: ['Hyaluronic acid', 'Panthenol', 'Ceramides'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [5.6, 6.8], moq: 500, lead: 8 },
  { id: 'HVF-FC-1117', s: 'SUP-12', name: 'Ultra Rich Face Cream Panthenol', cat: 'Face care', sub: 'Cream', area: ['Face', 'Nose'], ml: 100, ing: ['Panthenol', 'Ceramides', 'Shea butter'], cert: ['vegan', 'derm_tested', 'fragrance_free'], label: PL, price: [6.2, 7.4], moq: 250, lead: 8 },
  { id: 'HVF-SP-1125', s: 'SUP-12', name: 'Post-Laser Soothing Balm', cat: 'Special care', sub: 'Balm', area: ['Face'], ml: 50, ing: ['Bisabolol', 'Allantoin', 'Panthenol'], cert: ['vegan', 'derm_tested'], label: BOTH, price: [5.1, 6.2], moq: 500, lead: 7 },
  { id: 'HVF-SP-1133', s: 'SUP-12', name: 'Hyaluron Multi-Molecular Serum', cat: 'Special care', sub: 'Serum', area: ['Face'], ml: 30, ing: ['Hyaluronic acid', 'Ectoin'], cert: ['vegan', 'cruelty_free'], label: BOTH, price: [6.8, 8.2], moq: 500, lead: 8 },
];

export const products: Product[] = seeds.map((seed) => ({
  id: seed.id,
  supplierId: seed.s,
  name: seed.name,
  category: seed.cat,
  subCategory: seed.sub,
  applicationArea: seed.area,
  volumeMl: seed.ml,
  keyIngredients: seed.ing,
  inciExcerpt: inciFor(seed.ing),
  certifications: seed.cert,
  labelTypes: seed.label,
  priceMin: seed.price[0],
  priceMax: seed.price[1],
  moq: seed.moq,
  leadTimeWeeks: seed.lead,
  inStockSamples: !seed.noSample,
  description: describe(seed),
  source: 'catalog',
  publishStatus: 'published',
  sourcedFromBriefId: null,
  createdAt: '2026-01-14T09:00:00.000Z',
}));

export const CATEGORIES: Category[] = [
  'Face care',
  'Body care',
  'Hair care',
  'Sun care',
  'Special care',
];

export const SUB_CATEGORIES: SubCategory[] = [
  'Cream',
  'Serum',
  'Balm',
  'Lotion',
  'Gel',
  'Oil',
  'Stick',
  'Shampoo',
  'Mask',
  'Foam',
];

export const ALL_CERTIFICATIONS: Certification[] = [
  'vegan',
  'cruelty_free',
  'organic_cosmos',
  'derm_tested',
  'halal',
  'fragrance_free',
];
