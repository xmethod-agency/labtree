import type { Brief, Category, Certification, LabelType, ParsedOffer, SubCategory } from '@/types';
import { ALL_CERTIFICATIONS, CATEGORIES, INCI, SUB_CATEGORIES } from '@/data/products';

/**
 * A live model writes "Vegan", "Face Care" or "Organic COSMOS" where the app
 * expects enum values. Everything coming back from the model passes through here
 * so matching stays deterministic.
 */

const INGREDIENT_KEYS = Object.keys(INCI);

function toCertification(value: string): Certification | null {
  const v = value.toLowerCase();
  if (ALL_CERTIFICATIONS.includes(v as Certification)) return v as Certification;
  if (v.includes('vegan')) return 'vegan';
  if (v.includes('cruelty')) return 'cruelty_free';
  if (v.includes('cosmos') || v.includes('organic') || v.includes('bio')) return 'organic_cosmos';
  if (v.includes('derm')) return 'derm_tested';
  if (v.includes('halal')) return 'halal';
  if (v.includes('fragrance') || v.includes('parfum')) return 'fragrance_free';
  return null;
}

function toLabelType(value: string): LabelType | null {
  const v = value.toLowerCase();
  if (v.includes('private')) return 'private_label';
  if (v.includes('white')) return 'white_label';
  return null;
}

function toCategory(value: string): Category | null {
  const v = value.toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORIES.find((c) => c.toLowerCase().replace(/[^a-z]/g, '') === v) ?? null;
}

function toSubCategory(value: string): SubCategory | null {
  const v = value.toLowerCase();
  return SUB_CATEGORIES.find((s) => s.toLowerCase() === v) ?? null;
}

function toIngredient(value: string) {
  const v = value.trim().toLowerCase();
  return INGREDIENT_KEYS.find((key) => key.toLowerCase() === v) ?? value.trim();
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((v) => v.trim());
  return [];
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.replace(',', '.').replace(/[^\d.]/g, '')) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeBriefPatch(raw: Record<string, unknown>): Partial<Brief> {
  const patch: Partial<Brief> = {};

  if (raw.category != null) {
    const category = toCategory(String(raw.category));
    if (category) patch.category = category;
  }
  if (raw.subCategory != null) {
    const sub = toSubCategory(String(raw.subCategory));
    if (sub) patch.subCategory = sub;
  }
  if (raw.applicationArea != null) {
    const areas = asArray(raw.applicationArea).map(
      (a) => a.charAt(0).toUpperCase() + a.slice(1).toLowerCase(),
    );
    if (areas.length) patch.applicationArea = areas;
  }
  if (raw.volumeMl != null) {
    const volume = asNumber(raw.volumeMl);
    if (volume) patch.volumeMl = volume;
  }
  if (raw.keyIngredients != null) {
    patch.keyIngredients = asArray(raw.keyIngredients).map(toIngredient);
  }
  if (raw.certifications != null) {
    patch.certifications = asArray(raw.certifications)
      .map(toCertification)
      .filter((c): c is Certification => c !== null);
  }
  if (raw.labelType != null) {
    const label = toLabelType(String(raw.labelType));
    if (label) patch.labelType = label;
  }
  if (raw.quantity != null) {
    const quantity = asNumber(raw.quantity);
    if (quantity) patch.quantity = quantity;
  }
  if (raw.targetPriceMin != null) {
    const price = asNumber(raw.targetPriceMin);
    if (price != null) patch.targetPriceMin = price;
  }
  if (raw.targetPriceMax != null) {
    const price = asNumber(raw.targetPriceMax);
    if (price != null) patch.targetPriceMax = price;
  }
  if (raw.notes != null && String(raw.notes).trim()) patch.notes = String(raw.notes).trim();

  return patch;
}

export function normalizeParsedOffer(
  raw: Record<string, unknown>,
  fallback: ParsedOffer,
): ParsedOffer {
  const certifications = raw.certifications
    ? asArray(raw.certifications)
        .map(toCertification)
        .filter((c): c is Certification => c !== null)
    : fallback.certifications;

  const labelTypes = raw.labelTypes
    ? asArray(raw.labelTypes)
        .map(toLabelType)
        .filter((l): l is LabelType => l !== null)
    : fallback.labelTypes;

  const fieldConfidence =
    raw.fieldConfidence && typeof raw.fieldConfidence === 'object'
      ? Object.fromEntries(
          Object.entries(raw.fieldConfidence as Record<string, unknown>).map(([key, value]) => [
            key,
            asNumber(value) ?? 60,
          ]),
        )
      : fallback.fieldConfidence;

  const values = Object.values(fieldConfidence);

  return {
    productName: raw.productName ? String(raw.productName) : fallback.productName,
    volumeMl: asNumber(raw.volumeMl) ?? fallback.volumeMl,
    keyIngredients: raw.keyIngredients
      ? asArray(raw.keyIngredients).map(toIngredient)
      : fallback.keyIngredients,
    inciExcerpt: raw.inciExcerpt ? String(raw.inciExcerpt) : fallback.inciExcerpt,
    certifications,
    priceMin: asNumber(raw.priceMin) ?? fallback.priceMin,
    priceMax: asNumber(raw.priceMax) ?? fallback.priceMax,
    moq: asNumber(raw.moq) ?? fallback.moq,
    leadTimeWeeks: asNumber(raw.leadTimeWeeks) ?? fallback.leadTimeWeeks,
    labelTypes: labelTypes.length ? labelTypes : ['white_label'],
    fieldConfidence,
    confidence: values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : fallback.confidence,
    needsReview: values.length ? values.some((c) => c < 70) : fallback.needsReview,
  };
}

export function normalizeProductCopy(
  raw: Record<string, unknown>,
  fallback: { category: Category; subCategory: SubCategory; applicationArea: string[] },
) {
  return {
    category: raw.category ? (toCategory(String(raw.category)) ?? fallback.category) : fallback.category,
    subCategory: raw.subCategory
      ? (toSubCategory(String(raw.subCategory)) ?? fallback.subCategory)
      : fallback.subCategory,
    applicationArea: raw.applicationArea
      ? asArray(raw.applicationArea).map((a) => a.charAt(0).toUpperCase() + a.slice(1))
      : fallback.applicationArea,
  };
}
