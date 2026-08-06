import type { Brief } from '@/types';
import { extractBriefPatch, nextQuestion } from '@/data/scenarios';
import { agency } from '@/data/customer';
import { personaFor } from '@/data/personas';
import { deviationNotes } from '@/data/replies';
import { CERTIFICATION_LABEL, LABEL_TYPE_LABEL } from '@/data/products';
import { mockProvider, parseOfferFromBody, supplierEmailTemplate } from '@/lib/ai/mockProvider';
import {
  normalizeBriefPatch,
  normalizeParsedOffer,
  normalizeProductCopy,
} from '@/lib/ai/normalize';
import {
  CHAT_SYSTEM_PROMPT,
  DRAFT_EMAIL_SYSTEM_PROMPT,
  PARSE_OFFER_SYSTEM_PROMPT,
  PRODUCT_COPY_SYSTEM_PROMPT,
  SUPPLIER_REPLY_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';
import { OPENROUTER_MODEL, type AiProvider, type ChatTurnResult } from '@/lib/ai/provider';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Single network seam of the whole app. If the key is missing or the call fails,
 * every method falls back to the scripted provider so a live demo cannot break.
 */
async function complete(messages: ChatCompletionMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY is not set');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Labtree Sourcing Demo',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('OpenRouter returned no content');
  return content;
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned) as T;
}

function warn(scope: string, error: unknown) {
  console.warn(`[ai] ${scope} fell back to the scripted provider:`, error);
}

export const openrouterProvider: AiProvider = {
  id: 'openrouter',
  label: `Live · ${OPENROUTER_MODEL}`,

  async chatTurn(input): Promise<ChatTurnResult> {
    try {
      const history = input.history
        .filter((m) => m.role !== 'system')
        .slice(-10)
        .map<ChatCompletionMessage>((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }));

      const raw = await complete([
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        {
          role: 'system',
          content: `Current brief state (null = still unknown): ${JSON.stringify({
            category: input.brief.category,
            subCategory: input.brief.subCategory,
            applicationArea: input.brief.applicationArea,
            volumeMl: input.brief.volumeMl,
            keyIngredients: input.brief.keyIngredients,
            certifications: input.brief.certifications,
            labelType: input.brief.labelType,
            quantity: input.brief.quantity,
            targetPriceMin: input.brief.targetPriceMin,
            targetPriceMax: input.brief.targetPriceMax,
          })}`,
        },
        ...history,
        { role: 'user', content: input.userText },
      ]);

      const parsed = parseJson<{
        reply: string;
        patch: Record<string, unknown>;
        ready?: boolean;
        outOfScope?: boolean;
      }>(raw);

      const modelPatch = normalizeBriefPatch(
        Object.fromEntries(
          Object.entries(parsed.patch ?? {}).filter(
            ([, value]) => value !== null && value !== undefined && value !== '',
          ),
        ),
      );

      // Deterministic keyword extraction runs as a floor under the model: domain
      // shortcuts such as "mineral filter" -> Zinc oxide + Titanium dioxide must
      // always land in the structured fields, or the matching loses its teeth.
      const rulePatch = extractBriefPatch(input.userText);
      const patch: Partial<Brief> = { ...rulePatch, ...modelPatch };
      const mergedIngredients = [
        ...(modelPatch.keyIngredients ?? []),
        ...(rulePatch.keyIngredients ?? []),
      ];
      if (mergedIngredients.length) patch.keyIngredients = [...new Set(mergedIngredients)];
      const mergedCertifications = [
        ...(modelPatch.certifications ?? []),
        ...(rulePatch.certifications ?? []),
      ];
      if (mergedCertifications.length) patch.certifications = [...new Set(mergedCertifications)];

      const merged: Brief = { ...input.brief, ...patch };
      // Chips still come from the scripted question tree so the demo stays clickable.
      const question = nextQuestion(merged, input.askedIds);

      return {
        reply: parsed.reply,
        patch,
        quickReplies: parsed.ready ? [] : (question?.quickReplies ?? []),
        multiSelect: Boolean(question?.multiSelect),
        ready: Boolean(parsed.ready) || !question,
        askedQuestionId: question?.id ?? null,
        outOfScope: Boolean(parsed.outOfScope),
      };
    } catch (error) {
      warn('chatTurn', error);
      return mockProvider.chatTurn(input);
    }
  },

  async draftSupplierEmail(input) {
    try {
      const raw = await complete([
        { role: 'system', content: DRAFT_EMAIL_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Brief: ${JSON.stringify(input.brief)}\nManufacturer: ${input.supplier.name} (${
            input.supplier.country
          })\nPersonal response form URL (must appear in the email body): ${input.formUrl}\nSignature:\n${agency.signature}`,
        },
      ]);
      const parsed = parseJson<{ subject: string; body: string }>(raw);
      if (!parsed.subject || !parsed.body) throw new Error('incomplete email');
      const body = parsed.body.includes(input.formUrl)
        ? parsed.body
        : `${parsed.body}\n\nSubmit your offer here: ${input.formUrl}`;
      return { subject: parsed.subject, body };
    } catch (error) {
      warn('draftSupplierEmail', error);
      return supplierEmailTemplate(input);
    }
  },

  async draftSupplierReply(input) {
    const { brief, supplier, kind, offer, enquiry } = input;
    const persona = personaFor(supplier.id);
    const fallback = () => mockProvider.draftSupplierReply(input);

    try {
      const commercial =
        kind === 'decline'
          ? 'None — this is a rejection. Do not quote any prices, quantities or lead times.'
          : JSON.stringify({
              productName: offer.productName,
              fillVolumeMl: offer.volumeMl,
              actives: offer.keyIngredients,
              inci: persona.omits.includes('inci') ? undefined : offer.inciExcerpt,
              certifications: persona.omits.includes('certifications')
                ? undefined
                : offer.certifications.map((c) => CERTIFICATION_LABEL[c]),
              // Only the persona's own price format is handed over, so a
              // "per 1,000 pieces" quote genuinely has to be normalised later.
              price:
                persona.priceUnit === 'per 1,000 pieces'
                  ? `${(offer.priceMin * 1000).toFixed(0)} – ${(offer.priceMax * 1000).toFixed(
                      0,
                    )} EUR per 1,000 pieces`
                  : `${offer.priceMin.toFixed(2)} – ${offer.priceMax.toFixed(2)} EUR ${persona.priceUnit}`,
              minimumOrderQuantity: persona.omits.includes('moq')
                ? undefined
                : persona.palletSize
                  ? `${offer.moq} pieces (${Math.round((offer.moq / persona.palletSize) * 10) / 10} pallets at ${persona.palletSize} pieces per pallet)`
                  : `${offer.moq} pieces`,
              leadTimeWeeks: persona.omits.includes('leadTime') ? undefined : offer.leadTimeWeeks,
              labelTypes: offer.labelTypes.map((l) => LABEL_TYPE_LABEL[l]),
            });

      const raw = await complete([
        { role: 'system', content: SUPPLIER_REPLY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Persona:
- Signatory: ${persona.name}, ${persona.role}, ${supplier.name} (${supplier.country})
- Language: ${persona.language}
- Voice: ${persona.style}
- Structure: ${persona.formatting}
- Quotes prices: ${persona.priceUnit}
- Leaves out: ${persona.omits.length ? persona.omits.join(', ') : 'nothing'}
- Attachment mentioned: ${persona.attaches ? 'yes' : 'no'}

Reply type: ${kind === 'offer_deviation' ? 'offer with deviations' : kind}
${
  kind === 'offer_deviation'
    ? `Deviations to state: ${deviationNotes(brief, offer).join('; ')}`
    : ''
}

Commercial data to use verbatim: ${commercial}

The enquiry being answered:
${enquiry}`,
        },
      ]);

      const parsed = parseJson<{ body?: string }>(raw);
      if (!parsed.body || parsed.body.length < 60) throw new Error('reply too short');
      return { body: parsed.body };
    } catch (error) {
      warn('draftSupplierReply', error);
      return fallback();
    }
  },

  async parseOffer({ email, brief }) {
    const fallback = parseOfferFromBody(email.body, brief);
    try {
      const raw = await complete([
        { role: 'system', content: PARSE_OFFER_SYSTEM_PROMPT },
        { role: 'user', content: email.body },
      ]);
      return normalizeParsedOffer(parseJson<Record<string, unknown>>(raw), fallback);
    } catch (error) {
      warn('parseOffer', error);
      return fallback;
    }
  },

  async enrichProductCopy(input) {
    const fallback = await mockProvider.enrichProductCopy(input);
    try {
      const raw = await complete([
        { role: 'system', content: PRODUCT_COPY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Offer: ${JSON.stringify(input.offer)}\nOriginal brief: ${JSON.stringify(input.brief)}`,
        },
      ]);
      const parsed = parseJson<Record<string, unknown>>(raw);
      return {
        name: parsed.name ? String(parsed.name) : fallback.name,
        description: parsed.description ? String(parsed.description) : fallback.description,
        ...normalizeProductCopy(parsed, fallback),
      };
    } catch (error) {
      warn('enrichProductCopy', error);
      return fallback;
    }
  },
};
