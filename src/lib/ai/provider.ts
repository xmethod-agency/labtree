import type {
  Brief,
  Category,
  ChatMessage,
  EmailMessage,
  ParsedOffer,
  ReplyKind,
  Supplier,
  SubCategory,
} from '@/types';
import type { QuickReply } from '@/data/scenarios';
import type { OfferDraft } from '@/data/replies';

export interface ChatTurnInput {
  brief: Brief;
  userText: string;
  /** Question ids already asked in this session — prevents loops. */
  askedIds: string[];
  history: ChatMessage[];
}

export interface ChatTurnResult {
  reply: string;
  patch: Partial<Brief>;
  quickReplies: QuickReply[];
  multiSelect: boolean;
  /** True when the brief is complete enough to run the match. */
  ready: boolean;
  askedQuestionId: string | null;
  outOfScope: boolean;
}

export interface DraftEmailInput {
  brief: Brief;
  supplier: Supplier;
  /** Personal form URL the supplier uses to submit an offer. */
  formUrl: string;
}

export interface DraftReplyInput {
  brief: Brief;
  supplier: Supplier;
  kind: ReplyKind;
  /** Ground-truth commercial data — the persona may reword it but never change it. */
  offer: OfferDraft;
  /** The enquiry the manufacturer is answering. */
  enquiry: string;
}

export interface ProductCopy {
  name: string;
  description: string;
  category: Category;
  subCategory: SubCategory;
  applicationArea: string[];
}

export interface AiProvider {
  id: 'mock' | 'openrouter';
  label: string;
  chatTurn(input: ChatTurnInput): Promise<ChatTurnResult>;
  draftSupplierEmail(input: DraftEmailInput): Promise<{ subject: string; body: string }>;
  /** Writes the manufacturer's answer in that manufacturer's own voice. */
  draftSupplierReply(input: DraftReplyInput): Promise<{ body: string }>;
  parseOffer(input: { email: EmailMessage; brief: Brief }): Promise<ParsedOffer>;
  enrichProductCopy(input: { offer: ParsedOffer; brief: Brief }): Promise<ProductCopy>;
}

export type AiMode = 'auto' | 'mock' | 'live';

export const hasOpenRouterKey = Boolean(import.meta.env.VITE_OPENROUTER_API_KEY);

export const OPENROUTER_MODEL =
  (import.meta.env.VITE_OPENROUTER_MODEL as string | undefined) ?? 'openai/gpt-4o-mini';
