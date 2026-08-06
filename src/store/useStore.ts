import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
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
  ShippingAddress,
} from '@/types';
import { products as catalogSeed } from '@/data/products';
import { suppliers } from '@/data/suppliers';
import { agency, customer } from '@/data/customer';
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

function emptyBrief(id: string, inputMethod: Brief['inputMethod'], raw: string): Brief {
  return {
    id,
    createdAt: now(),
    status: 'draft',
    raw,
    inputMethod,
    customerName: customer.name,
    company: customer.company,
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
  const brief: Brief = { ...emptyBrief(id, 'chat', patch.raw ?? ''), ...patch, id, createdAt, status };
  brief.matchIds = matchProducts(brief, catalogSeed).map((m) => m.productId);
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
  activity: ActivityItem[];
  counters: { brief: number; order: number };
  activeBriefId: string | null;

  setRole: (role: Role) => void;
  setAiMode: (mode: AiMode) => void;
  setReplyMode: (mode: ReplyMode) => void;
  toggleSupplierNames: () => void;

  createBrief: (inputMethod: Brief['inputMethod'], raw: string) => string;
  updateBrief: (id: string, patch: Partial<Brief>) => void;
  setActiveBrief: (id: string | null) => void;
  appendChat: (briefId: string, message: ChatMessage) => void;
  markAsked: (briefId: string, questionId: string) => void;
  runMatch: (briefId: string) => string[];

  updateProduct: (id: string, patch: Partial<Product>) => void;
  createOrder: (briefId: string, productId: string, address: ShippingAddress) => string;
  advanceOrder: (orderId: string) => void;

  startSourcing: (briefId: string, supplierIds: string[]) => Promise<void>;
  updateThread: (threadId: string, patch: Partial<EmailThread>) => void;
  updateThreadDraft: (threadId: string, subject: string, body: string) => void;
  sendThreads: (briefId: string) => void;
  deliverReply: (threadId: string) => Promise<void>;
  /** Demo control: the presenter writes the manufacturer's reply by hand. */
  injectSupplierReply: (threadId: string, body: string) => Promise<void>;
  fastForward: (briefId: string) => Promise<void>;
  followUp: (threadId: string) => Promise<void>;
  updateParsedOffer: (threadId: string, patch: Partial<ParsedOffer>) => void;
  importOffer: (threadId: string) => Promise<{ productId: string; newMatches: number } | null>;

  logActivity: (kind: ActivityItem['kind'], text: string) => void;
  resetDemo: () => void;
}

const initialState = {
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
  activity: SEED_ACTIVITY,
  counters: { brief: 147, order: 87 },
  activeBriefId: null as string | null,
};

/** Pending reply timers live outside the persisted store. */
const replyTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRole: (role) => set({ role }),
      setAiMode: (aiMode) => set({ aiMode }),
      setReplyMode: (replyMode) => set({ replyMode }),
      toggleSupplierNames: () => set((s) => ({ revealSupplierNames: !s.revealSupplierNames })),

      logActivity: (kind, text) =>
        set((s) => ({
          activity: [{ id: uid('act'), timestamp: now(), kind, text }, ...s.activity].slice(0, 40),
        })),

      createBrief: (inputMethod, raw) => {
        const next = get().counters.brief + 1;
        const id = `BR-2026-${String(next).padStart(4, '0')}`;
        set((s) => ({
          counters: { ...s.counters, brief: next },
          briefs: [emptyBrief(id, inputMethod, raw), ...s.briefs],
          chats: { ...s.chats, [id]: [] },
          askedIds: { ...s.askedIds, [id]: [] },
          activeBriefId: id,
        }));
        get().logActivity('brief', `Brief ${id} opened via ${inputMethod}`);
        return id;
      },

      updateBrief: (id, patch) =>
        set((s) => ({
          briefs: s.briefs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

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
        const results = matchProducts(brief, products);
        const matchIds = results.map((r) => r.productId);
        set((s) => ({
          briefs: s.briefs.map((b) =>
            b.id === briefId
              ? { ...b, matchIds, status: matchIds.length ? 'matched' : 'sourcing' }
              : b,
          ),
        }));
        get().logActivity(
          'match',
          matchIds.length
            ? `Brief ${briefId}: ${matchIds.length} matches found`
            : `Brief ${briefId}: no catalog match — sourcing required`,
        );
        return matchIds;
      },

      updateProduct: (id, patch) => {
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
        get().logActivity('catalog', `${id} updated in the catalog`);
      },

      createOrder: (briefId, productId, address) => {
        const next = get().counters.order + 1;
        const id = `SO-2026-${String(next).padStart(4, '0')}`;
        const order: SampleOrder = {
          id,
          briefId,
          productId,
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
            const { subject, body } = await provider.draftSupplierEmail({ brief, supplier });
            const thread: EmailThread = {
              id: `TH-${briefId.slice(-4)}-${supplierId.slice(-2)}`,
              briefId,
              supplierId,
              status: 'draft',
              replyKind: REPLY_MIX[index % REPLY_MIX.length],
              replyDelayMs: replyDelayFor(supplier),
              sentAt: null,
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
          `${drafts.length} enquiries drafted for ${briefId} (AI-generated)`,
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
        get().logActivity('sourcing', `${threads.length} enquiries sent for ${briefId}`);

        // In manual mode nothing is scheduled — every reply is typed by the presenter.
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
        // `composing` guards against a timer and a fast-forward firing together.
        if (!thread || thread.status !== 'awaiting_reply' || thread.composing) return;
        const brief = state.briefs.find((b) => b.id === thread.briefId);
        const supplier = suppliers.find((s) => s.id === thread.supplierId);
        if (!brief || !supplier) return;

        const outbound = thread.messages[0];
        const deviation = thread.replyKind === 'offer_deviation';
        const isDecline = thread.replyKind === 'decline';
        const offer = buildOffer(brief, supplier, deviation);
        const provider = getProvider(get().aiMode);

        // The reply itself is written by the model in this manufacturer's voice,
        // which is what makes the extraction step further down worth showing.
        set((s) => ({
          threads: s.threads.map((t) => (t.id === threadId ? { ...t, composing: true } : t)),
        }));

        const { body } = await provider.draftSupplierReply({
          brief,
          supplier,
          kind: thread.replyKind,
          offer,
          enquiry: outbound.body,
        });

        const inbound: EmailMessage = {
          id: uid('msg'),
          direction: 'inbound',
          from: supplier.contactEmail,
          to: agency.email,
          subject: `Re: ${outbound.subject}`,
          body,
          timestamp: now(),
          attachmentName:
            isDecline || !personaFor(supplier.id).attaches ? undefined : attachmentFor(offer),
        };

        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  status: isDecline ? 'declined' : 'replied',
                  composing: false,
                  parsing: !isDecline,
                  messages: [...t.messages, inbound],
                }
              : t,
          ),
        }));
        get().logActivity(
          'sourcing',
          isDecline
            ? `${supplier.name} declined the enquiry`
            : `Reply from ${supplier.name} received`,
        );

        if (isDecline) return;

        const parsedOffer = await provider.parseOffer({ email: inbound, brief });
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

        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  parsing: false,
                  parsedOffer: hasOffer ? parsedOffer : null,
                  status: hasOffer ? 'parsed' : 'declined',
                }
              : t,
          ),
        }));
        get().logActivity(
          'sourcing',
          hasOffer
            ? `Offer from ${supplier.name} extracted (${parsedOffer.confidence}% confidence)`
            : `Reply from ${supplier.name} contains no offer data`,
        );
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
          body: followUpBody(brief),
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
        const brief = state.briefs.find((b) => b.id === thread?.briefId);
        if (!thread?.parsedOffer || !brief) return null;

        const provider = getProvider(state.aiMode);
        const copy = await provider.enrichProductCopy({ offer: thread.parsedOffer, brief });
        const offer = thread.parsedOffer;
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
          createdAt: now(),
        };

        const before = get().briefs.find((b) => b.id === brief.id)?.matchIds.length ?? 0;
        set((s) => ({
          products: [product, ...s.products],
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, status: 'imported', createdProductId: productId } : t,
          ),
        }));
        get().logActivity('catalog', `${productId} added to catalog from ${supplier.name} offer`);

        const matchIds = get().runMatch(brief.id);
        return { productId, newMatches: Math.max(0, matchIds.length - before) };
      },

      resetDemo: () => {
        for (const timer of replyTimers.values()) clearTimeout(timer);
        replyTimers.clear();
        set({ ...initialState });
      },
    }),
    {
      name: 'labtree-demo-v1',
      version: 1,
      partialize: (state) => ({
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
