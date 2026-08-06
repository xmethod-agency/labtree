import type {
  Brief,
  MatchBreakdownItem,
  MatchCriterion,
  MatchResult,
  Product,
} from '@/types';
import { CERTIFICATION_LABEL } from '@/data/products';
import { formatNumber } from '@/lib/utils';

/**
 * Deterministic scoring. Nothing here is hardcoded per scenario — the demo
 * outcomes come from the seeded catalog in `src/data/products.ts`.
 *
 * Swapping this module for a server-side / embedding-based matcher later only
 * requires keeping the `MatchResult` shape.
 */
export const WEIGHTS: Record<MatchCriterion, number> = {
  category: 20,
  volume: 20,
  ingredients: 20,
  certifications: 15,
  price: 10,
  moq: 10,
  leadTime: 5,
};

export const CRITERION_LABEL: Record<MatchCriterion, string> = {
  category: 'Category',
  volume: 'Fill volume',
  ingredients: 'Actives',
  certifications: 'Certifications',
  price: 'Target price',
  moq: 'MOQ',
  leadTime: 'Lead time',
};

/** A zero on one of these criteria disqualifies the product outright. */
const KNOCKOUT: MatchCriterion[] = ['category', 'ingredients'];

export const MIN_SCORE = 40;

function verdictFor(score: number): MatchBreakdownItem['verdict'] {
  if (score >= 90) return 'match';
  if (score >= 45) return 'partial';
  return 'mismatch';
}

function scoreCategory(brief: Brief, product: Product) {
  if (!brief.category) return null;
  if (brief.category !== product.category) {
    return { score: 0, note: `${product.category} instead of ${brief.category}` };
  }
  const areaRequested = brief.applicationArea ?? [];
  const areaHit =
    areaRequested.length === 0 ||
    areaRequested.some((a) =>
      product.applicationArea.some((p) => p.toLowerCase() === a.toLowerCase()),
    );
  if (brief.subCategory && brief.subCategory !== product.subCategory) {
    return {
      score: areaHit ? 65 : 50,
      note: `${product.subCategory} instead of ${brief.subCategory}`,
    };
  }
  if (!areaHit) {
    return {
      score: 70,
      note: `Application area ${product.applicationArea.join('/')} — ${areaRequested.join('/')} not declared`,
    };
  }
  return {
    score: 100,
    note: `${product.category} / ${product.subCategory} · ${product.applicationArea.join(', ')}`,
  };
}

function scoreVolume(brief: Brief, product: Product) {
  if (!brief.volumeMl) return null;
  const deviation = Math.abs(product.volumeMl - brief.volumeMl) / brief.volumeMl;
  if (deviation === 0) {
    return { score: 100, note: `${product.volumeMl} ml as requested` };
  }
  if (deviation <= 0.2) {
    return {
      score: 70,
      note: `${product.volumeMl} ml instead of ${brief.volumeMl} ml`,
    };
  }
  return {
    score: Math.max(0, Math.round(100 - deviation * 150)),
    note: `${product.volumeMl} ml instead of ${brief.volumeMl} ml`,
  };
}

function scoreIngredients(brief: Brief, product: Product) {
  const requested = brief.keyIngredients ?? [];
  if (requested.length === 0) return null;
  const present = requested.filter((r) =>
    product.keyIngredients.some((k) => k.toLowerCase() === r.toLowerCase()),
  );
  const missing = requested.filter((r) => !present.includes(r));
  const score = Math.round((present.length / requested.length) * 100);
  const note =
    missing.length === 0
      ? `All actives present: ${present.join(', ')}`
      : `Missing: ${missing.join(', ')}`;
  return { score, note };
}

function scoreCertifications(brief: Brief, product: Product) {
  const requested = brief.certifications ?? [];
  if (requested.length === 0) return null;
  const missing = requested.filter((c) => !product.certifications.includes(c));
  const score = Math.round(((requested.length - missing.length) / requested.length) * 100);
  const note =
    missing.length === 0
      ? `Certified: ${requested.map((c) => CERTIFICATION_LABEL[c]).join(', ')}`
      : `Missing: ${missing.map((c) => CERTIFICATION_LABEL[c]).join(', ')}`;
  return { score, note };
}

function scorePrice(brief: Brief, product: Product) {
  const { targetPriceMin, targetPriceMax } = brief;
  if (targetPriceMin == null && targetPriceMax == null) return null;
  const min = targetPriceMin ?? 0;
  const max = targetPriceMax ?? Number.POSITIVE_INFINITY;
  const priceLabel = `${product.priceMin.toFixed(2)}–${product.priceMax.toFixed(2)} €/unit`;
  const overlap = Math.min(product.priceMax, max) - Math.max(product.priceMin, min);
  if (overlap >= 0) {
    const withinFully = product.priceMin >= min && product.priceMax <= max;
    return {
      score: withinFully ? 100 : 80,
      note: withinFully ? `${priceLabel} — inside target range` : `${priceLabel} — partly inside range`,
    };
  }
  const distance = product.priceMin > max ? product.priceMin - max : min - product.priceMax;
  const reference = max === Number.POSITIVE_INFINITY ? min || 1 : max || 1;
  const score = Math.max(0, Math.round(100 - (distance / reference) * 180));
  return {
    score,
    note: `${priceLabel} — above target of max. ${max.toFixed(2)} €`,
  };
}

function scoreMoq(brief: Brief, product: Product) {
  if (!brief.quantity) return null;
  if (product.moq <= brief.quantity) {
    return { score: 100, note: `MOQ ${formatNumber(product.moq)} units — covered` };
  }
  return {
    score: 0,
    note: `MOQ ${formatNumber(product.moq)} units, ${formatNumber(brief.quantity)} requested`,
  };
}

function scoreLeadTime(_brief: Brief, product: Product) {
  const weeks = product.leadTimeWeeks;
  const score = weeks <= 4 ? 100 : weeks <= 6 ? 85 : weeks <= 8 ? 65 : 45;
  return { score, note: `${weeks} weeks to delivery` };
}

const SCORERS: Record<
  MatchCriterion,
  (brief: Brief, product: Product) => { score: number; note: string } | null
> = {
  category: scoreCategory,
  volume: scoreVolume,
  ingredients: scoreIngredients,
  certifications: scoreCertifications,
  price: scorePrice,
  moq: scoreMoq,
  leadTime: scoreLeadTime,
};

const ORDER: MatchCriterion[] = [
  'category',
  'volume',
  'ingredients',
  'certifications',
  'price',
  'moq',
  'leadTime',
];

export function scoreProduct(brief: Brief, product: Product): MatchResult {
  const raw: { criterion: MatchCriterion; score: number; note: string; weight: number }[] = [];

  for (const criterion of ORDER) {
    const result = SCORERS[criterion](brief, product);
    if (!result) continue;
    raw.push({ criterion, score: result.score, note: result.note, weight: WEIGHTS[criterion] });
  }

  // Criteria the brief does not specify are dropped and the remaining weights
  // are rescaled, so an incomplete brief cannot inflate scores.
  const weightSum = raw.reduce((sum, item) => sum + item.weight, 0) || 1;
  const breakdown: MatchBreakdownItem[] = raw.map((item) => ({
    criterion: item.criterion,
    score: item.score,
    weight: Math.round((item.weight / weightSum) * 100),
    verdict: verdictFor(item.score),
    note: item.note,
  }));

  const totalScore = Math.round(
    raw.reduce((sum, item) => sum + item.score * (item.weight / weightSum), 0),
  );

  const knockout = raw.some((item) => KNOCKOUT.includes(item.criterion) && item.score === 0);

  return { productId: product.id, totalScore, knockout, breakdown };
}

export function matchProducts(
  brief: Brief,
  catalog: Product[],
  options: { limit?: number } = {},
): MatchResult[] {
  const limit = options.limit ?? 5;
  return catalog
    .map((product) => scoreProduct(brief, product))
    .filter((result) => !result.knockout && result.totalScore >= MIN_SCORE)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

/** Products that were evaluated but rejected — used for the "why nothing matched" panel. */
export function rejectedProducts(brief: Brief, catalog: Product[], limit = 4) {
  return catalog
    .map((product) => scoreProduct(brief, product))
    .filter((result) => result.knockout || result.totalScore < MIN_SCORE)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

export function scoreTone(score: number) {
  if (score >= 85) return 'good' as const;
  if (score >= 60) return 'warn' as const;
  return 'bad' as const;
}
