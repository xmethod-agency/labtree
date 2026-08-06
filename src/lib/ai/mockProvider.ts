import type { Brief, Certification, LabelType, ParsedOffer } from '@/types';
import {
  CATALOG_SIZE_CLAIM,
  QUESTIONS,
  extractBriefPatch,
  isOutOfScope,
  nextQuestion,
  STARTER_PROMPTS,
} from '@/data/scenarios';
import { CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { declineBody, offerBody } from '@/data/replies';
import { agency } from '@/data/customer';
import { formatNumber, sleep } from '@/lib/utils';
import { suppliers } from '@/data/suppliers';
import type {
  AiProvider,
  ChatTurnInput,
  ChatTurnResult,
  DraftEmailInput,
  ProductCopy,
} from '@/lib/ai/provider';

const SKIP = '__skip__';

const FIELD_LABEL: Record<string, string> = {
  category: 'Category',
  subCategory: 'Texture',
  applicationArea: 'Application area',
  volumeMl: 'Fill volume',
  keyIngredients: 'Actives',
  certifications: 'Certifications',
  labelType: 'Label',
  quantity: 'Quantity',
  targetPriceMin: 'Target price',
  targetPriceMax: 'Target price',
  notes: 'Note',
};

function humanValue(field: string, value: unknown): string {
  if (value == null) return '—';
  if (field === 'certifications') {
    return (value as Certification[]).map((c) => CERTIFICATION_LABEL[c]).join(', ');
  }
  if (field === 'labelType') return LABEL_TYPE_LABEL[value as LabelType];
  if (field === 'volumeMl') return `${value} ml`;
  if (field === 'quantity') return `${formatNumber(value as number)} units`;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function acknowledgement(patch: Partial<Brief>) {
  const parts = Object.entries(patch)
    .filter(([field]) => field !== 'targetPriceMax' && field !== 'notes')
    .map(([field, value]) =>
      field === 'targetPriceMin'
        ? `Target price ${(value as number).toFixed(2)}–${(patch.targetPriceMax ?? 0).toFixed(2)} €`
        : `${FIELD_LABEL[field] ?? field} ${humanValue(field, value)}`,
    );
  if (!parts.length) return '';
  return `Recorded: ${parts.join(' · ')}.\n\n`;
}

function briefSummary(brief: Brief) {
  const lines = [
    `${brief.category ?? '—'} / ${brief.subCategory ?? '—'}`,
    `${brief.volumeMl ?? '—'} ml`,
    brief.keyIngredients?.length ? brief.keyIngredients.join(', ') : 'no actives specified',
    brief.certifications?.length
      ? brief.certifications.map((c) => CERTIFICATION_LABEL[c]).join(', ')
      : 'no certification requirement',
  ];
  return lines.join(' · ');
}

function parseCertifications(text: string): Certification[] {
  const t = text.toLowerCase();
  const found: Certification[] = [];
  if (t.includes('vegan')) found.push('vegan');
  if (t.includes('cruelty')) found.push('cruelty_free');
  if (t.includes('cosmos') || t.includes('organic')) found.push('organic_cosmos');
  if (t.includes('dermatolog') || t.includes('derm.')) found.push('derm_tested');
  if (t.includes('halal')) found.push('halal');
  if (t.includes('fragrance-free') || t.includes('fragrance free')) found.push('fragrance_free');
  return found;
}

function parseLabels(text: string): LabelType[] {
  const t = text.toLowerCase();
  const labels: LabelType[] = [];
  if (t.includes('white label')) labels.push('white_label');
  if (t.includes('private label')) labels.push('private_label');
  return labels.length ? labels : ['white_label'];
}

/**
 * Regex extraction over the supplier email body. The live provider does the same
 * job with an LLM — both return the identical `ParsedOffer` shape.
 */
export function parseOfferFromBody(body: string, brief: Brief): ParsedOffer {
  const grab = (pattern: RegExp) => body.match(pattern)?.[1]?.trim() ?? '';

  const productName = grab(/Product:\s*(.+)/);
  const volume = Number(grab(/Fill volume:\s*(\d+)/)) || brief.volumeMl || 0;
  const actives = grab(/Actives:\s*(.+)/)
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const inci = grab(/INCI:\s*(.+)/);
  const certLine = grab(/Certifications:\s*(.+)/);
  const priceMatch = body.match(/Price:\s*([\d.,]+)\s*-\s*([\d.,]+)/);
  const moq = Number(grab(/MOQ:\s*([\d.,']+)/).replace(/[.,']/g, '')) || 0;
  const lead = Number(grab(/Lead time:\s*(\d+)/)) || 0;
  const labelLine = grab(/Label:\s*(.+)/);

  const priceMin = priceMatch ? Number(priceMatch[1].replace(',', '.')) : 0;
  const priceMax = priceMatch ? Number(priceMatch[2].replace(',', '.')) : 0;

  const fieldConfidence: Record<string, number> = {
    productName: productName ? 96 : 40,
    volumeMl: volume ? 99 : 35,
    keyIngredients: actives.length ? 91 : 44,
    inciExcerpt: inci ? 88 : 42,
    certifications: certLine ? 93 : 48,
    priceMin: priceMin ? 97 : 38,
    priceMax: priceMax ? 97 : 38,
    moq: moq ? 95 : 40,
    leadTimeWeeks: lead ? 90 : 41,
    // Label wording in supplier emails is the least reliable field in practice.
    labelTypes: labelLine ? 64 : 38,
  };

  const values = Object.values(fieldConfidence);
  const confidence = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return {
    productName: productName || `${brief.subCategory ?? 'Product'} ${volume} ml`,
    volumeMl: volume,
    keyIngredients: actives,
    certifications: parseCertifications(certLine),
    priceMin,
    priceMax,
    moq,
    leadTimeWeeks: lead,
    labelTypes: parseLabels(labelLine),
    inciExcerpt: inci,
    confidence,
    fieldConfidence,
    needsReview: Object.values(fieldConfidence).some((c) => c < 70),
  };
}

export function supplierEmailTemplate({ brief, supplier }: DraftEmailInput) {
  const certs = brief.certifications?.length
    ? brief.certifications.map((c) => CERTIFICATION_LABEL[c]).join(', ')
    : 'none';
  const subject = `Product enquiry — ${brief.subCategory ?? 'product'} ${brief.volumeMl ?? '—'} ml (${certs})`;

  const row = (label: string, value: string) => `• ${label.padEnd(18, ' ')}${value}`;

  const body = `Dear Sir or Madam,

on behalf of one of our customers we are looking for the following product:

${row('Category:', `${brief.category ?? '—'} / ${brief.subCategory ?? '—'}`)}
${row('Application:', brief.applicationArea?.join(', ') || '—')}
${row('Fill volume:', `${brief.volumeMl ?? '—'} ml`)}
${row('Actives:', brief.keyIngredients?.join(', ') || '—')}
${row('Certifications:', certs)}
${row('Label:', brief.labelType ? LABEL_TYPE_LABEL[brief.labelType] : 'both possible')}
${row('Target quantity:', `from ${formatNumber(brief.quantity ?? 0)} units`)}
${row(
  'Target price:',
  `${(brief.targetPriceMin ?? 0).toFixed(2)}–${(brief.targetPriceMax ?? 0).toFixed(2)} € / unit`,
)}

Please send us your offer including data sheet and INCI list. Reference: ${brief.id}.

Kind regards
${agency.signature}

--
Enquiry sent to: ${supplier.name}, ${supplier.country}`;

  return { subject, body };
}

export const mockProvider: AiProvider = {
  id: 'mock',
  label: 'Scripted (mock)',

  async chatTurn({ brief, userText, askedIds }: ChatTurnInput): Promise<ChatTurnResult> {
    await sleep(320);

    const patch = extractBriefPatch(userText);

    // Only redirect when the message carries no usable cosmetic signal at all.
    if (isOutOfScope(userText) && Object.keys(patch).length === 0) {
      return {
        reply:
          'That is outside what I can help with — I only handle cosmetic product development: formulation, fill volumes, certifications, packaging and manufacturers. Shall we start with one of these?',
        patch: {},
        quickReplies: STARTER_PROMPTS.map((s) => ({ label: s.label, value: s.value })),
        multiSelect: false,
        ready: false,
        askedQuestionId: null,
        outOfScope: true,
      };
    }

    if (userText.includes(SKIP)) {
      const lastId = askedIds[askedIds.length - 1];
      const question = QUESTIONS.find((q) => q.id === lastId);
      if (question?.field === 'keyIngredients') patch.keyIngredients = [];
      if (question?.field === 'certifications') patch.certifications = [];
    }

    const merged: Brief = { ...brief, ...patch };
    const question = nextQuestion(merged, askedIds);
    const ack = acknowledgement(patch);

    if (!question) {
      return {
        reply: `${ack}The brief is complete: ${briefSummary(merged)}.\n\nI am now searching ${formatNumber(
          CATALOG_SIZE_CLAIM,
        )} products from ${suppliers.length} manufacturers…`,
        patch,
        quickReplies: [],
        multiSelect: false,
        ready: true,
        askedQuestionId: null,
        outOfScope: false,
      };
    }

    return {
      reply: `${ack}${question.prompt}${question.hint ? `\n\n${question.hint}` : ''}`,
      patch,
      quickReplies: question.quickReplies,
      multiSelect: Boolean(question.multiSelect),
      ready: false,
      askedQuestionId: question.id,
      outOfScope: false,
    };
  },

  async draftSupplierEmail(input) {
    await sleep(240);
    return supplierEmailTemplate(input);
  },

  async draftSupplierReply({ brief, supplier, kind, offer }) {
    await sleep(400);
    return {
      body:
        kind === 'decline'
          ? declineBody(brief, supplier)
          : offerBody(brief, supplier, offer, kind === 'offer_deviation'),
    };
  },

  async parseOffer({ email, brief }) {
    await sleep(700);
    return parseOfferFromBody(email.body, brief);
  },

  async enrichProductCopy({ offer, brief }): Promise<ProductCopy> {
    await sleep(500);
    const actives = offer.keyIngredients.slice(0, 3).join(', ');
    const certs = offer.certifications.map((c) => CERTIFICATION_LABEL[c]).join(', ');
    return {
      name: offer.productName,
      description: `${offer.keyIngredients[0] ?? 'Actives'}-led ${(
        brief.subCategory ?? 'formulation'
      ).toLowerCase()} in a ${offer.volumeMl} ml fill, sourced for a customer brief and released to the catalog. Declared actives: ${actives}. ${
        certs ? `Certified ${certs}.` : 'No third-party certification on file yet.'
      }`,
      category: brief.category ?? 'Special care',
      subCategory: brief.subCategory ?? 'Cream',
      applicationArea: brief.applicationArea ?? ['Body'],
    };
  },
};
