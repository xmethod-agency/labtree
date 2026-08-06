export type Role = 'customer' | 'admin';

export interface ShippingAddress {
  name: string;
  company: string;
  street: string;
  zip: string;
  city: string;
  country: string;
}

export interface Account {
  id: string;
  email: string;
  /** Demo-only plaintext password. */
  password: string;
  role: Role;
  name: string;
  company: string;
  jobTitle: string;
  address: ShippingAddress;
}

export type LabelType = 'white_label' | 'private_label';

export type PublishStatus = 'draft' | 'published';

export type Certification =
  | 'vegan'
  | 'cruelty_free'
  | 'organic_cosmos'
  | 'derm_tested'
  | 'halal'
  | 'fragrance_free';

export type Category = 'Face care' | 'Body care' | 'Hair care' | 'Sun care' | 'Special care';

export type SubCategory =
  | 'Cream'
  | 'Serum'
  | 'Balm'
  | 'Lotion'
  | 'Gel'
  | 'Oil'
  | 'Stick'
  | 'Shampoo'
  | 'Mask'
  | 'Foam';

export interface Supplier {
  id: string;
  name: string;
  country: string;
  contactEmail: string;
  specialties: string[];
  avgResponseDays: number;
  reliabilityScore: number;
  productCount: number;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  category: Category;
  subCategory: SubCategory;
  applicationArea: string[];
  volumeMl: number;
  keyIngredients: string[];
  inciExcerpt: string;
  certifications: Certification[];
  labelTypes: LabelType[];
  priceMin: number;
  priceMax: number;
  moq: number;
  leadTimeWeeks: number;
  inStockSamples: boolean;
  description: string;
  source: 'catalog' | 'sourced';
  /** Draft products stay invisible to customers until an admin publishes them. */
  publishStatus: PublishStatus;
  /** Brief that triggered sourcing for this product, if any. */
  sourcedFromBriefId?: string | null;
  createdAt: string;
}

export type BriefStatus =
  | 'draft'
  | 'matching'
  | 'matched'
  | 'sourcing_requested'
  | 'sourcing'
  | 'completed';

export type BriefField =
  | 'category'
  | 'subCategory'
  | 'applicationArea'
  | 'volumeMl'
  | 'keyIngredients'
  | 'certifications'
  | 'labelType'
  | 'targetPriceMin'
  | 'targetPriceMax'
  | 'quantity'
  | 'notes';

export interface Brief {
  id: string;
  createdAt: string;
  status: BriefStatus;
  raw: string;
  inputMethod: 'chat' | 'pdf' | 'excel' | 'form';
  /** Owning customer account — used to scope customer views. */
  accountId: string;
  customerName: string;
  company: string;
  category: Category | null;
  subCategory: SubCategory | null;
  applicationArea: string[] | null;
  volumeMl: number | null;
  keyIngredients: string[] | null;
  certifications: Certification[] | null;
  labelType: LabelType | null;
  targetPriceMin: number | null;
  targetPriceMax: number | null;
  quantity: number | null;
  notes: string | null;
  matchIds: string[];
  /** Per-field extraction confidence, 0-100. Used by the PDF/AI extraction views. */
  confidence?: Partial<Record<BriefField, number>>;
}

export type MatchCriterion =
  | 'category'
  | 'volume'
  | 'ingredients'
  | 'certifications'
  | 'price'
  | 'moq'
  | 'leadTime';

export interface MatchBreakdownItem {
  criterion: MatchCriterion;
  score: number;
  weight: number;
  verdict: 'match' | 'partial' | 'mismatch';
  note: string;
}

export interface MatchResult {
  productId: string;
  totalScore: number;
  knockout: boolean;
  breakdown: MatchBreakdownItem[];
}

export type SampleOrderStatus = 'requested' | 'label_created' | 'shipped' | 'delivered';

export interface SampleOrder {
  id: string;
  briefId: string;
  productId: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  status: SampleOrderStatus;
  trackingNumber: string | null;
  createdAt: string;
  statusHistory: { status: SampleOrderStatus; timestamp: string }[];
}

export type ThreadStatus =
  | 'draft'
  | 'sent'
  | 'awaiting_reply'
  | 'replied'
  | 'parsed'
  | 'declined'
  | 'draft_created'
  | 'published'
  | 'imported';

export interface EmailMessage {
  id: string;
  direction: 'outbound' | 'inbound';
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  attachmentName?: string;
}

/** Structured supplier response submitted via the personal form link. */
export interface SupplierFormSubmission {
  productName: string;
  volumeMl: number;
  keyIngredients: string;
  certifications: Certification[];
  priceMin: number;
  priceMax: number;
  moq: number;
  leadTimeWeeks: number;
  labelTypes: LabelType[];
  inciExcerpt: string;
  notes: string;
  sampleAvailable: boolean;
}

export interface ParsedOffer {
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
  confidence: number;
  fieldConfidence: Record<string, number>;
  needsReview: boolean;
}

export type ReplyKind = 'offer' | 'offer_deviation' | 'decline' | 'silent';

export interface EmailThread {
  id: string;
  briefId: string;
  supplierId: string;
  status: ThreadStatus;
  replyKind: ReplyKind;
  /** Simulated delay in ms until the reply arrives. */
  replyDelayMs: number;
  sentAt: string | null;
  messages: EmailMessage[];
  parsedOffer: ParsedOffer | null;
  /** Unique token for the supplier response form URL. */
  formToken: string;
  /** The AI is writing the manufacturer's reply. */
  composing?: boolean;
  /** The AI is extracting product data from a received reply. */
  parsing: boolean;
  createdProductId: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  /** Rendered as an attachment chip in the transcript. */
  attachmentName?: string;
  /** Present on the "searching the catalog" message. */
  searchSteps?: string[];
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  kind: 'brief' | 'match' | 'sourcing' | 'catalog' | 'sample' | 'system';
  text: string;
}
