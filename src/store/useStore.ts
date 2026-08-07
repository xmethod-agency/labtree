import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Account,
  ActivityItem,
  Brief,
  ChatMessage,
  EmailMessage,
  EmailThread,
  ParsedOffer,
  Product,
  Role,
  SampleOrder,
  SampleOrderStatus,
  SavedProduct,
  ShippingAddress,
  SupplierFormSubmission,
} from '@/types';
import { products as catalogSeed } from '@/data/products';
import { suppliers } from '@/data/suppliers';
import { SEED_ACCOUNTS, agency, customer } from '@/data/accounts';
import {
  REPLY_MIX,
  attachmentFor,
  buildOffer,
  followUpBody,
  holdingBody,
  replyDelayFor,
} from '@/data/replies';
import { personaFor } from '@/data/personas';
import { matchProducts } from '@/lib/matching';
import { getProvider } from '@/lib/ai';
import type { AiMode } from '@/lib/ai/provider';
import { uid } from '@/lib/utils';

const now = () => new Date().toISOString();
const DEFAULT_ACCOUNT_ID = SEED_ACCOUNTS[0].id;

function formUrlFor(token: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/supplier/respond/${token}`;
  }
  return `/supplier/respond/${token}`;
}

function publishedCatalog(products: Product[]) {
  return products.filter((p) => p.publishStatus === 'published');
}

function emptyBrief(
  id: string,
  inputMethod: Brief['inputMethod'],
  raw: string,
  account: Account,
): Brief {
  return {
    id,
    createdAt: now(),
    status: 'draft',
    raw,
    inputMethod,
    accountId: account.id,
    customerName: account.name,
    company: account.company,
    category: null,
    subCategory: null,
    applicationArea: null,
    volumeMl: null,
    keyIngredients: null,
    certifications: null,
    labelType: null,
    targetPriceMin: null,
    targetPriceMax: null,
    quantity: null,
    notes: null,
    matchIds: [],
  };
}

function seedBrief(
  id: string,
  createdAt: string,
  patch: Partial<Brief>,
  status: Brief['status'],
): Brief {
  const account = SEED_ACCOUNTS[0];
  const brief: Brief = {
    ...emptyBrief(id, 'chat', patch.raw ?? '', account),
    ...patch,
    id,
    createdAt,
    status,
    accountId: account.id,
  };
  brief.matchIds = matchProducts(brief, publishedCatalog(catalogSeed)).map((m) => m.productId);
  return brief;
}

const SEED_BRIEFS: Brief[] = [
  seedBrief(
    'BR-2026-0143',
    '2026-07-28T10:12:00.000Z',
    {
      raw: 'We need a hyaluronic serum, 30 ml, vegan, 1,000 units, around 5 € per unit.',
      category: 'Face care',
      subCategory: 'Serum',
      applicationArea: ['Face'],
      volumeMl: 30,
      keyIngredients: ['Hyaluronic acid'],
      certifications: ['vegan'],
      labelType: 'white_label',
      quantity: 1000,
      targetPriceMin: 4,
      targetPriceMax: 6,
      notes: 'Relaunch of the existing serum line',
    },
    'completed',
  ),
  seedBrief(
    'BR-2026-0146',
    '2026-08-03T14:40:00.000Z',
    {
      raw: 'Nourishing body lotion 200 ml with shea butter, vegan, 2,500 units.',
      category: 'Body care',
      subCategory: 'Lotion',
      applicationArea: ['Body'],
      volumeMl: 200,
      keyIngredients: ['Shea butter'],
      certifications: ['vegan'],
      labelType: 'private_label',
      quantity: 2500,
      targetPriceMin: 2,
      targetPriceMax: 3,
    },
    'matched',
  ),
];

const SEED_CHATS: Record<string, ChatMessage[]> = {
  'BR-2026-0143': [
    {
      id: 'm1',
      role: 'user',
      content: 'We need a hyaluronic serum, 30 ml, vegan, 1,000 units, around 5 € per unit.',
      timestamp: '2026-07-28T10:12:00.000Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content:
        'Recorded: Category Face care · Texture Serum · Fill volume 30 ml · Actives Hyaluronic acid · Certifications Vegan.\n\nThe brief is complete. Three products from the catalog match.',
      timestamp: '2026-07-28T10:12:40.000Z',
    },
  ],
  'BR-2026-0146': [
    {
      id: 'm1',
      role: 'user',
      content: 'Nourishing body lotion 200 ml with shea butter, vegan, 2,500 units.',
      timestamp: '2026-08-03T14:40:00.000Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'Recorded: Category Body care · Texture Lotion · Fill volume 200 ml.\n\nFour products match your brief.',
      timestamp: '2026-08-03T14:40:35.000Z',
    },
  ],
};

const SEED_ORDERS: SampleOrder[] = [
  {
    id: 'SO-2026-0086',
    briefId: 'BR-2026-0143',
    productId: 'KWR-FC-0442',
    accountId: DEFAULT_ACCOUNT_ID,
    customerName: customer.name,
    shippingAddress: customer.address,
    status: 'shipped',
    trackingNumber: 'DHL-4711-8829-01',
    createdAt: '2026-07-29T08:20:00.000Z',
    statusHistory: [
      { status: 'requested', timestamp: '2026-07-29T08:20:00.000Z' },
      { status: 'label_created', timestamp: '2026-07-29T11:05:00.000Z' },
      { status: 'shipped', timestamp: '2026-07-30T07:40:00.000Z' },
    ],
  },
];

const SEED_SAVED: SavedProduct[] = [
  {
    id: 'sv-seed-1',
    accountId: DEFAULT_ACCOUNT_ID,
    productId: 'KWR-FC-0442',
    briefId: 'BR-2026-0143',
    savedAt: '2026-07-28T11:00:00.000Z',
  },
];

const SEED_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    timestamp: '2026-08-03T14:41:00.000Z',
    kind: 'brief',
    text: 'Brief BR-2026-0146 received via chat — 4 matches',
  },
  {
    id: 'a2',
    timestamp: '2026-07-30T07:40:00.000Z',
    kind: 'sample',
    text: 'Sample order SO-2026-0086 shipped (DHL-4711-8829-01)',
  },
  {
    id: 'a3',
    timestamp: '2026-07-28T10:13:00.000Z',
    kind: 'brief',
    text: 'Brief BR-2026-0143 completed',
  },
];

/** Who writes the manufacturer replies: the scripted simulation or the presenter. */
export type ReplyMode = 'auto' | 'manual';

interface DemoState {
  accounts: Account[];
  currentAccountId: string | null;
  role: Role;
  aiMode: AiMode;
  replyMode: ReplyMode;
  revealSupplierNames: boolean;
  products: Product[];
  briefs: Brief[];
  chats: Record<string, ChatMessage[]>;
  askedIds: Record<string, string[]>;
  threads: EmailThread[];
  orders: SampleOrder[];
  savedProducts: SavedProduct[];
  activity: ActivityItem[];
  counters: { brief: number; order: number };
  activeBriefId: string | null;

  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  register: (input: {
    name: string;
    company: string;
    email: string;
    password: string;
  }) => { ok: true } | { ok: false; error: string };
  switchAccount: (accountId: string) => void;
  logout: () => void;

  setAiMode: (mode: AiMode) => void;
  setReplyMode: (mode: ReplyMode) => void;
  toggleSupplierNames: () => void;

  createBrief: (inputMethod: Brief['inputMethod'], raw: string) => string;
  updateBrief: (id: string, patch: Partial<Brief>) => void;
  deleteBrief: (id: string) => void;
  setActiveBrief: (id: string | null) => void;
  appendChat: (briefId: string, message: ChatMessage) => void;
  markAsked: (briefId: string, questionId: string) => void;
  runMatch: (briefId: string) => string[];
  requestSourcing: (briefId: string) => void;

  updateProduct: (id: string, patch: Partial<Product>) => void;
  addToCatalog: (productId: string, briefId?: string | null) => boolean;
  removeFromCatalog: (productId: string) => void;
  createOrder: (briefId: string, productId: string, address: ShippingAddress) => string;
  advanceOrder: (orderId: string) => void;

  startSourcing: (briefId: string, supplierIds: string[]) => Promise<void>;
  updateThread: (threadId: string, patch: Partial<EmailThread>) => void;
  updateThreadDraft: (threadId: string, subject: string, body: string) => void;
  sendThreads: (briefId: string) => void;
  deliverReply: (threadId: string) => Promise<void>;
  injectSupplierReply: (threadId: string, body: string) => Promise<void>;
  submitSupplierForm: (
    token: string,
    submission: SupplierFormSubmission,
  ) => Promise<{ ok: true; productId: string } | { ok: false; error: string }>;
  fastForward: (briefId: string) => Promise<void>;
  followUp: (threadId: string) => Promise<void>;
  updateParsedOffer: (threadId: string, patch: Partial<ParsedOffer>) => void;
  /** Creates a draft catalog product from a parsed offer — not visible to customers yet. */
  importOffer: (threadId: string) => Promise<{ productId: string; newMatches: number } | null>;
  /** Publishes a draft product and re-matches the linked brief. */
  publishProduct: (productId: string) => { newMatches: number } | null;

  logActivity: (kind: ActivityItem['kind'], text: string) => void;
  resetDemo: () => void;
}

const initialState = {
  accounts: SEED_ACCOUNTS,
  currentAccountId: DEFAULT_ACCOUNT_ID as string | null,
  role: 'customer' as Role,
  aiMode: 'auto' as AiMode,
  replyMode: 'auto' as ReplyMode,
  revealSupplierNames: false,
  products: catalogSeed,
  briefs: SEED_BRIEFS,
  chats: SEED_CHATS,
  askedIds: {} as Record<string, string[]>,
  threads: [] as EmailThread[],
  orders: SEED_ORDERS,
  savedProducts: SEED_SAVED,
  activity: SEED_ACTIVITY,
  counters: { brief: 147, order: 87 },
  activeBriefId: null as string | null,
};

/** Pending reply timers live outside the persisted store. */
const replyTimers = new Map<string, ReturnType<typeof setTimeout>>();

function currentAccount(state: { accounts: Account[]; currentAccountId: string | null }) {
  return state.accounts.find((a) => a.id === state.currentAccountId) ?? null;
}

function offerFromSubmission(submission: SupplierFormSubmission, brief: Brief): ParsedOffer {
  return {
    productName: submission.productName,
    volumeMl: submission.volumeMl,
    keyIngredients: submission.keyIngredients
      .split(/[,;·]/)
      .map((s) => s.trim())
      .filter(Boolean),
    certifications: submission.certifications,
    priceMin: submission.priceMin,
    priceMax: submission.priceMax,
    moq: submission.moq,
    leadTimeWeeks: submission.leadTimeWeeks,
    labelTypes: submission.labelTypes.length
      ? submission.labelTypes
      : brief.labelType
        ? [brief.labelType]
        : ['white_label', 'private_label'],
    inciExcerpt: submission.inciExcerpt,
    confidence: 100,
    fieldConfidence: {
      productName: 100,
      volumeMl: 100,
      keyIngredients: 100,
      certifications: 100,
      priceMin: 100,
      priceMax: 100,
      moq: 100,
      leadTimeWeeks: 100,
      inciExcerpt: 100,
    },
    needsReview: false,
  };
}

async function createDraftFromOffer(
  get: () => DemoState,
  set: (partial: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) => void,
  threadId: string,
  offer: ParsedOffer,
): Promise<{ productId: string; newMatches: number } | null> {
  const state = get();
  const thread = state.threads.find((t) => t.id === threadId);
  const brief = state.briefs.find((b) => b.id === thread?.briefId);
  if (!thread || !brief) return null;

  const provider = getProvider(state.aiMode);
  const copy = await provider.enrichProductCopy({ offer, brief });
  const supplier = suppliers.find((s) => s.id === thread.supplierId)!;
  const skuBase = supplier.name.replace(/[^A-Z]/g, '').slice(0, 3) || 'NEW';
  const productId = `${skuBase}-NW-${Math.floor(1000 + Math.random() * 8999)}`;

  const product: Product = {
    id: productId,
    supplierId: thread.supplierId,
    name: copy.name,
    category: copy.category,
    subCategory: copy.subCategory,
    applicationArea: copy.applicationArea,
    volumeMl: offer.volumeMl,
    keyIngredients: offer.keyIngredients,
    inciExcerpt: offer.inciExcerpt,
    certifications: offer.certifications,
    labelTypes: offer.labelTypes,
    priceMin: offer.priceMin,
    priceMax: offer.priceMax,
    moq: offer.moq,
    leadTimeWeeks: offer.leadTimeWeeks,
    inStockSamples: false,
    description: copy.description,
    source: 'sourced',
    publishStatus: 'draft',
    sourcedFromBriefId: brief.id,
    createdAt: now(),
  };

  set((s) => ({
    products: [product, ...s.products],
    threads: s.threads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            status: 'draft_created',
            parsedOffer: offer,
            createdProductId: productId,
            parsing: false,
            composing: false,
          }
        : t,
    ),
  }));
  get().logActivity(
    'catalog',
    `Draft product ${productId} created from ${supplier.name} — awaiting publish`,
  );
  return { productId, newMatches: 0 };
}

export const useStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (email, password) => {
        const account = get().accounts.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!account || account.password !== password) {
          return { ok: false, error: 'Invalid email or password' };
        }
        set({ currentAccountId: account.id, role: account.role });
        return { ok: true };
      },

      register: ({ name, company, email, password }) => {
        const normalized = email.trim().toLowerCase();
        if (!name.trim() || !company.trim() || !normalized || password.length < 4) {
          return { ok: false, error: 'Please fill in all fields (password min. 4 characters)' };
        }
        if (get().accounts.some((a) => a.email.toLowerCase() === normalized)) {
          return { ok: false, error: 'An account with this email already exists' };
        }
        const account: Account = {
          id: uid('acc'),
          email: normalized,
          password,
          role: 'customer',
          name: name.trim(),
          company: company.trim(),
          jobTitle: 'Customer',
          address: {
            name: name.trim(),
            company: company.trim(),
            street: '',
            zip: '',
            city: '',
            country: 'Germany',
          },
        };
        set((s) => ({
          accounts: [...s.accounts, account],
          currentAccountId: account.id,
          role: 'customer',
        }));
        get().logActivity('system', `Account registered: ${account.email}`);
        return { ok: true };
      },

      switchAccount: (accountId) => {
        const account = get().accounts.find((a) => a.id === accountId);
        if (!account) return;
        set({
          currentAccountId: account.id,
          role: account.role,
          activeBriefId: null,
        });
      },

      logout: () => set({ currentAccountId: null, role: 'customer', activeBriefId: null }),

      setAiMode: (aiMode) => set({ aiMode }),
      setReplyMode: (replyMode) => set({ replyMode }),
      toggleSupplierNames: () => set((s) => ({ revealSupplierNames: !s.revealSupplierNames })),

      logActivity: (kind, text) =>
        set((s) => ({
          activity: [{ id: uid('act'), timestamp: now(), kind, text }, ...s.activity].slice(0, 40),
        })),

      createBrief: (inputMethod, raw) => {
        const account = currentAccount(get());
        if (!account || account.role !== 'customer') {
          throw new Error('Only customers can create briefs');
        }
        const next = get().counters.brief + 1;
        const id = `BR-2026-${String(next).padStart(4, '0')}`;
        set((s) => ({
          counters: { ...s.counters, brief: next },
          briefs: [emptyBrief(id, inputMethod, raw, account), ...s.briefs],
          chats: { ...s.chats, [id]: [] },
          askedIds: { ...s.askedIds, [id]: [] },
          activeBriefId: id,
        }));
        get().logActivity('brief', `Brief ${id} opened via ${inputMethod} by ${account.name}`);
        return id;
      },

      updateBrief: (id, patch) =>
        set((s) => ({
          briefs: s.briefs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      deleteBrief: (id) => {
        const state = get();
        const { [id]: _chat, ...restChats } = state.chats;
        const { [id]: _asked, ...restAsked } = state.askedIds;
        void _chat;
        void _asked;
        const remaining = state.briefs.filter((b) => b.id !== id);
        const nextActive =
          state.activeBriefId === id
            ? remaining.find((b) => b.accountId === state.currentAccountId)?.id ?? null
            : state.activeBriefId;
        set({
          briefs: remaining,
          chats: restChats,
          askedIds: restAsked,
          activeBriefId: nextActive,
        });
        get().logActivity('brief', `Brief ${id} deleted`);
      },

      setActiveBrief: (activeBriefId) => set({ activeBriefId }),

      appendChat: (briefId, message) =>
        set((s) => ({
          chats: { ...s.chats, [briefId]: [...(s.chats[briefId] ?? []), message] },
        })),

      markAsked: (briefId, questionId) =>
        set((s) => ({
          askedIds: {
            ...s.askedIds,
            [briefId]: [...(s.askedIds[briefId] ?? []), questionId],
          },
        })),

      runMatch: (briefId) => {
        const { briefs, products } = get();
        const brief = briefs.find((b) => b.id === briefId);
        if (!brief) return [];
        const results = matchProducts(brief, publishedCatalog(products));
        const matchIds = results.map((r) => r.productId);
        set((s) => ({
          briefs: s.briefs.map((b) =>
            b.id === briefId
              ? {
                  ...b,
                  matchIds,
                  // Keep an existing sourcing workflow; otherwise stay on matched so the
                  // customer can choose to refine the brief or request sourcing manually.
                  status:
                    b.status === 'sourcing' || b.status === 'sourcing_requested'
                      ? b.status
                      : 'matched',
                }
              : b,
          ),
        }));
        get().logActivity(
          'match',
          matchIds.length
            ? `Brief ${briefId}: ${matchIds.length} matches found`
            : `Brief ${briefId}: no catalog match — awaiting customer decision`,
        );
        return matchIds;
      },

      requestSourcing: (briefId) => {
        const brief = get().briefs.find((b) => b.id === briefId);
        if (!brief) return;
        set((s) => ({
          briefs: s.briefs.map((b) =>
            b.id === briefId ? { ...b, status: 'sourcing_requested' } : b,
          ),
        }));
        get().logActivity(
          'sourcing',
          `Sourcing requested for ${briefId} (${brief.company}) — awaiting Labtree admin`,
        );
      },

      updateProduct: (id, patch) => {
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
        get().logActivity('catalog', `${id} updated in the catalog`);
      },

      addToCatalog: (productId, briefId = null) => {
        const account = currentAccount(get());
        if (!account || account.role !== 'customer') return false;
        const product = get().products.find(
          (p) => p.id === productId && p.publishStatus === 'published',
        );
        if (!product) return false;
        const already = get().savedProducts.some(
          (s) => s.accountId === account.id && s.productId === productId,
        );
        if (already) return false;
        const item: SavedProduct = {
          id: uid('sv'),
          accountId: account.id,
          productId,
          briefId: briefId ?? null,
          savedAt: now(),
        };
        set((s) => ({ savedProducts: [item, ...s.savedProducts] }));
        get().logActivity('catalog', `${account.name} saved ${productId} to personal catalog`);
        return true;
      },

      removeFromCatalog: (productId) => {
        const account = currentAccount(get());
        if (!account) return;
        set((s) => ({
          savedProducts: s.savedProducts.filter(
            (item) => !(item.accountId === account.id && item.productId === productId),
          ),
        }));
        get().logActivity('catalog', `${account.name} removed ${productId} from personal catalog`);
      },

      createOrder: (briefId, productId, address) => {
        const account = currentAccount(get());
        const next = get().counters.order + 1;
        const id = `SO-2026-${String(next).padStart(4, '0')}`;
        const order: SampleOrder = {
          id,
          briefId,
          productId,
          accountId: account?.id ?? '',
          customerName: address.name,
          shippingAddress: address,
          status: 'requested',
          trackingNumber: null,
          createdAt: now(),
          statusHistory: [{ status: 'requested', timestamp: now() }],
        };
        set((s) => ({ counters: { ...s.counters, order: next }, orders: [order, ...s.orders] }));
        get().logActivity('sample', `Sample order ${id} for ${productId} requested`);
        return id;
      },

      advanceOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;
        const flow: SampleOrderStatus[] = ['requested', 'label_created', 'shipped', 'delivered'];
        const nextStatus = flow[flow.indexOf(order.status) + 1];
        if (!nextStatus) return;
        const trackingNumber =
          nextStatus === 'label_created'
            ? `DHL-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(
                1000 + Math.random() * 8999,
              )}-01`
            : order.trackingNumber;
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: nextStatus,
                  trackingNumber,
                  statusHistory: [...o.statusHistory, { status: nextStatus, timestamp: now() }],
                }
              : o,
          ),
        }));
        get().logActivity(
          'sample',
          `Sample order ${orderId} → ${nextStatus.replace('_', ' ')}${
            nextStatus === 'label_created' && trackingNumber ? ` (${trackingNumber})` : ''
          }`,
        );
      },

      startSourcing: async (briefId, supplierIds) => {
        const brief = get().briefs.find((b) => b.id === briefId);
        if (!brief) return;
        const provider = getProvider(get().aiMode);

        const drafts = await Promise.all(
          supplierIds.map(async (supplierId, index) => {
            const supplier = suppliers.find((s) => s.id === supplierId)!;
            const formToken = uid('frm');
            const { subject, body } = await provider.draftSupplierEmail({
              brief,
              supplier,
              formUrl: formUrlFor(formToken),
            });
            const thread: EmailThread = {
              id: `TH-${briefId.slice(-4)}-${supplierId.slice(-2)}`,
              briefId,
              supplierId,
              status: 'draft',
              replyKind: REPLY_MIX[index % REPLY_MIX.length],
              replyDelayMs: replyDelayFor(supplier),
              sentAt: null,
              formToken,
              composing: false,
              parsing: false,
              parsedOffer: null,
              createdProductId: null,
              messages: [
                {
                  id: uid('msg'),
                  direction: 'outbound',
                  from: agency.email,
                  to: supplier.contactEmail,
                  subject,
                  body,
                  timestamp: now(),
                },
              ],
            };
            return thread;
          }),
        );

        set((s) => ({
          threads: [...s.threads.filter((t) => t.briefId !== briefId), ...drafts],
          briefs: s.briefs.map((b) => (b.id === briefId ? { ...b, status: 'sourcing' } : b)),
        }));
        get().logActivity(
          'sourcing',
          `${drafts.length} standardised RFQs drafted for ${briefId}`,
        );
      },

      updateThread: (threadId, patch) =>
        set((s) => ({
          threads: s.threads.map((t) => (t.id === threadId ? { ...t, ...patch } : t)),
        })),

      updateThreadDraft: (threadId, subject, body) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m, i) => (i === 0 ? { ...m, subject, body } : m)),
                }
              : t,
          ),
        })),

      sendThreads: (briefId) => {
        const threads = get().threads.filter((t) => t.briefId === briefId && t.status === 'draft');
        set((s) => ({
          threads: s.threads.map((t) =>
            t.briefId === briefId && t.status === 'draft'
              ? { ...t, status: 'awaiting_reply', sentAt: now() }
              : t,
          ),
        }));
        get().logActivity('sourcing', `${threads.length} RFQs sent for ${briefId}`);

        if (get().replyMode === 'manual') return;

        for (const thread of threads) {
          if (thread.replyKind === 'silent') continue;
          const timer = setTimeout(() => {
            replyTimers.delete(thread.id);
            void get().deliverReply(thread.id);
          }, thread.replyDelayMs);
          replyTimers.set(thread.id, timer);
        }
      },

      deliverReply: async (threadId) => {
        const state = get();
        const thread = state.threads.find((t) => t.id === threadId);
        if (!thread || thread.status !== 'awaiting_reply' || thread.composing) return;
        const brief = state.briefs.find((b) => b.id === thread.briefId);
        const supplier = suppliers.find((s) => s.id === thread.supplierId);
        if (!brief || !supplier) return;

        const isDecline = thread.replyKind === 'decline';
        set((s) => ({
          threads: s.threads.map((t) => (t.id === threadId ? { ...t, composing: true } : t)),
        }));

        if (isDecline) {
          const inbound: EmailMessage = {
            id: uid('msg'),
            direction: 'inbound',
            from: supplier.contactEmail,
            to: agency.email,
            subject: `Re: ${thread.messages[0].subject}`,
            body: `Dear Labtree team,\n\nUnfortunately we cannot offer a matching product for ${brief.id} at this time.\n\nKind regards\n${supplier.name}`,
            timestamp: now(),
          };
          set((s) => ({
            threads: s.threads.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    status: 'declined',
                    composing: false,
                    messages: [...t.messages, inbound],
                  }
                : t,
            ),
          }));
          get().logActivity('sourcing', `${supplier.name} declined the enquiry`);
          return;
        }

        // Simulate the supplier filling the personal response form.
        const deviation = thread.replyKind === 'offer_deviation';
        const offerDraft = buildOffer(brief, supplier, deviation);
        const submission: SupplierFormSubmission = {
          productName: offerDraft.productName,
          volumeMl: offerDraft.volumeMl,
          keyIngredients: offerDraft.keyIngredients.join(', '),
          certifications: offerDraft.certifications,
          priceMin: offerDraft.priceMin,
          priceMax: offerDraft.priceMax,
          moq: offerDraft.moq,
          leadTimeWeeks: offerDraft.leadTimeWeeks,
          labelTypes: offerDraft.labelTypes,
          inciExcerpt: offerDraft.inciExcerpt,
          notes: '',
          sampleAvailable: true,
        };

        const inbound: EmailMessage = {
          id: uid('msg'),
          direction: 'inbound',
          from: supplier.contactEmail,
          to: agency.email,
          subject: `Form response — ${brief.id}`,
          body: `${supplier.name} submitted the response form.\n\nProduct: ${submission.productName}\nVolume: ${submission.volumeMl} ml\nPrice: ${submission.priceMin}–${submission.priceMax} €\nMOQ: ${submission.moq}`,
          timestamp: now(),
          attachmentName: personaFor(supplier.id).attaches
            ? attachmentFor(offerDraft)
            : undefined,
        };

        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  status: 'replied',
                  composing: false,
                  parsing: true,
                  messages: [...t.messages, inbound],
                }
              : t,
          ),
        }));
        get().logActivity('sourcing', `Form response from ${supplier.name} received`);

        const parsedOffer = offerFromSubmission(submission, brief);
        await createDraftFromOffer(get, set, threadId, parsedOffer);
      },

      injectSupplierReply: async (threadId, body) => {
        const state = get();
        const thread = state.threads.find((t) => t.id === threadId);
        const brief = state.briefs.find((b) => b.id === thread?.briefId);
        const supplier = suppliers.find((s) => s.id === thread?.supplierId);
        if (!thread || !brief || !supplier || !body.trim()) return;

        const timer = replyTimers.get(threadId);
        if (timer) {
          clearTimeout(timer);
          replyTimers.delete(threadId);
        }

        const inbound: EmailMessage = {
          id: uid('msg'),
          direction: 'inbound',
          from: supplier.contactEmail,
          to: agency.email,
          subject: `Re: ${thread.messages[0]?.subject ?? brief.id}`,
          body: body.trim(),
          timestamp: now(),
        };

        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, status: 'replied', parsing: true, messages: [...t.messages, inbound] }
              : t,
          ),
        }));
        get().logActivity('sourcing', `Manual reply from ${supplier.name} added`);

        const parsedOffer = await getProvider(get().aiMode).parseOffer({ email: inbound, brief });
        const hasOffer = parsedOffer.volumeMl > 0 || parsedOffer.priceMin > 0;

        if (!hasOffer) {
          set((s) => ({
            threads: s.threads.map((t) =>
              t.id === threadId
                ? { ...t, parsing: false, parsedOffer: null, status: 'declined' }
                : t,
            ),
          }));
          get().logActivity('sourcing', `Reply from ${supplier.name} contains no offer data`);
          return;
        }

        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, parsing: false, parsedOffer, status: 'parsed' } : t,
          ),
        }));
        get().logActivity(
          'sourcing',
          `Offer from ${supplier.name} extracted (${parsedOffer.confidence}% confidence)`,
        );
      },

      submitSupplierForm: async (token, submission) => {
        const thread = get().threads.find((t) => t.formToken === token);
        if (!thread) return { ok: false, error: 'This form link is invalid or has expired.' };
        if (thread.status === 'draft_created' || thread.status === 'published' || thread.status === 'imported') {
          return { ok: false, error: 'An offer has already been submitted for this enquiry.' };
        }
        if (thread.status === 'declined') {
          return { ok: false, error: 'This enquiry was declined.' };
        }
        if (thread.status === 'draft') {
          return { ok: false, error: 'This enquiry has not been sent yet.' };
        }

        const brief = get().briefs.find((b) => b.id === thread.briefId);
        const supplier = suppliers.find((s) => s.id === thread.supplierId);
        if (!brief || !supplier) return { ok: false, error: 'Enquiry not found.' };

        const timer = replyTimers.get(thread.id);
        if (timer) {
          clearTimeout(timer);
          replyTimers.delete(thread.id);
        }

        if (!submission.productName.trim() || !submission.volumeMl || !submission.priceMin) {
          return { ok: false, error: 'Please fill in product name, volume and price.' };
        }

        const inbound: EmailMessage = {
          id: uid('msg'),
          direction: 'inbound',
          from: supplier.contactEmail,
          to: agency.email,
          subject: `Form response — ${brief.id}`,
          body: `${supplier.name} submitted the response form for ${brief.id}.`,
          timestamp: now(),
        };

        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === thread.id
              ? { ...t, status: 'replied', parsing: true, messages: [...t.messages, inbound] }
              : t,
          ),
        }));

        const parsedOffer = offerFromSubmission(submission, brief);
        const result = await createDraftFromOffer(get, set, thread.id, parsedOffer);
        if (!result) return { ok: false, error: 'Could not create product draft.' };
        return { ok: true, productId: result.productId };
      },

      fastForward: async (briefId) => {
        const pending = get().threads.filter(
          (t) => t.briefId === briefId && t.status === 'awaiting_reply' && t.replyKind !== 'silent',
        );
        for (const thread of pending) {
          const timer = replyTimers.get(thread.id);
          if (timer) {
            clearTimeout(timer);
            replyTimers.delete(thread.id);
          }
        }
        await Promise.all(pending.map((t) => get().deliverReply(t.id)));
      },

      followUp: async (threadId) => {
        const state = get();
        const thread = state.threads.find((t) => t.id === threadId);
        const brief = state.briefs.find((b) => b.id === thread?.briefId);
        const supplier = suppliers.find((s) => s.id === thread?.supplierId);
        if (!thread || !brief || !supplier) return;

        const reminder: EmailMessage = {
          id: uid('msg'),
          direction: 'outbound',
          from: agency.email,
          to: supplier.contactEmail,
          subject: `Follow-up: ${thread.messages[0].subject}`,
          body: `${followUpBody(brief)}\n\nYour personal form: ${formUrlFor(thread.formToken)}`,
          timestamp: now(),
        };
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, messages: [...t.messages, reminder] } : t,
          ),
        }));
        get().logActivity('sourcing', `Follow-up sent to ${supplier.name}`);

        await new Promise((resolve) => setTimeout(resolve, 2500));
        const holding: EmailMessage = {
          id: uid('msg'),
          direction: 'inbound',
          from: supplier.contactEmail,
          to: agency.email,
          subject: `Re: Follow-up: ${thread.messages[0].subject}`,
          body: holdingBody(supplier),
          timestamp: now(),
        };
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, messages: [...t.messages, holding] } : t,
          ),
        }));
      },

      updateParsedOffer: (threadId, patch) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId && t.parsedOffer
              ? { ...t, parsedOffer: { ...t.parsedOffer, ...patch } }
              : t,
          ),
        })),

      importOffer: async (threadId) => {
        const state = get();
        const thread = state.threads.find((t) => t.id === threadId);
        if (!thread?.parsedOffer) return null;
        if (thread.createdProductId) {
          return { productId: thread.createdProductId, newMatches: 0 };
        }
        return createDraftFromOffer(get, set, threadId, thread.parsedOffer);
      },

      publishProduct: (productId) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product || product.publishStatus === 'published') return null;

        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, publishStatus: 'published' } : p,
          ),
          threads: s.threads.map((t) =>
            t.createdProductId === productId ? { ...t, status: 'published' } : t,
          ),
        }));
        get().logActivity('catalog', `${productId} published to customer catalog`);

        const briefId = product.sourcedFromBriefId;
        if (!briefId) return { newMatches: 0 };
        const before = get().briefs.find((b) => b.id === briefId)?.matchIds.length ?? 0;
        const matchIds = get().runMatch(briefId);
        return { newMatches: Math.max(0, matchIds.length - before) };
      },

      resetDemo: () => {
        for (const timer of replyTimers.values()) clearTimeout(timer);
        replyTimers.clear();
        set({ ...initialState });
      },
    }),
    {
      name: 'labtree-demo-v3',
      version: 3,
      partialize: (state) => ({
        accounts: state.accounts,
        currentAccountId: state.currentAccountId,
        role: state.role,
        aiMode: state.aiMode,
        replyMode: state.replyMode,
        revealSupplierNames: state.revealSupplierNames,
        products: state.products,
        briefs: state.briefs,
        chats: state.chats,
        askedIds: state.askedIds,
        threads: state.threads,
        orders: state.orders,
        savedProducts: state.savedProducts,
        activity: state.activity,
        counters: state.counters,
        activeBriefId: state.activeBriefId,
      }),
    },
  ),
);

export const selectBrief = (id: string | undefined) => (s: DemoState) =>
  s.briefs.find((b) => b.id === id);
export const selectProduct = (id: string | undefined) => (s: DemoState) =>
  s.products.find((p) => p.id === id);
export const selectCurrentAccount = (s: DemoState) =>
  s.accounts.find((a) => a.id === s.currentAccountId) ?? null;
export const selectPublishedProducts = (s: DemoState) =>
  s.products.filter((p) => p.publishStatus === 'published');
