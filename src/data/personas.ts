/**
 * Writing personas for the manufacturer replies. The AI provider turns these
 * into actual emails, so the sourcing inbox reads like twelve different people
 * rather than one template — which is the whole point of showing AI extraction.
 *
 * Hand-editable: change `style`, `formatting` or `omits` to make a reply harder
 * or easier to parse during demo prep.
 */
export interface SupplierPersona {
  /** Signatory name and role, used in the closing. */
  name: string;
  role: string;
  language: 'English' | 'German' | 'English with Italian phrases' | 'English with Spanish phrases';
  style: string;
  formatting: string;
  /** Fields the persona deliberately leaves out — they end up low-confidence. */
  omits: ('inci' | 'certifications' | 'leadTime' | 'moq')[];
  /** Some quote per 1,000 units or per piece ex works — the parser has to normalise. */
  priceUnit: 'per piece' | 'per 1,000 pieces' | 'per piece ex works';
  /** Pieces per pallet, for personas that talk in pallets instead of pieces. */
  palletSize?: number;
  attaches: boolean;
}

export const SUPPLIER_PERSONAS: Record<string, SupplierPersona> = {
  'SUP-01': {
    name: 'Martina Ohlsen',
    role: 'Key Account Management',
    language: 'English',
    style:
      'German engineering matter-of-factness. No small talk beyond one opening line, no adjectives, states facts and moves on.',
    formatting: 'A clean labelled block: one specification per line, label followed by value.',
    omits: [],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-02': {
    name: 'Dr. Frank Bergmann',
    role: 'Technical Sales',
    language: 'English',
    style:
      'Dermatological and evidence-led. Mentions in-vivo tolerance testing and a subject count, treats the formulation as clinical.',
    formatting:
      'Two short paragraphs of prose, then the commercial data as a labelled block. Price given as a tier: one price at the stated MOQ, a lower one at double the quantity.',
    omits: [],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-03': {
    name: 'Sven Kruse',
    role: 'Sales',
    language: 'English',
    style:
      'Warm, sustainability-proud, a bit wordy. Mentions the COSMOS audit and raw-material origin before getting to numbers.',
    formatting:
      'Flowing prose only, no bullet points and no labels — every number sits inside a sentence.',
    omits: ['inci'],
    priceUnit: 'per piece',
    attaches: false,
  },
  'SUP-04': {
    name: 'Petra Lohmann',
    role: 'Inside Sales',
    language: 'English',
    style:
      'A filler and packer, not a formulator. Talks about filling lines, changeover times and pallet quantities first.',
    formatting:
      'Short intro, then a bullet list. Quotes the price per 1,000 pieces and states the MOQ as a number of pallets alongside the piece count.',
    omits: ['certifications'],
    priceUnit: 'per 1,000 pieces',
    palletSize: 480,
    attaches: false,
  },
  'SUP-05': {
    name: 'Giulia Ferrari',
    role: 'Export Sales',
    language: 'English with Italian phrases',
    style:
      'Enthusiastic Italian sales voice, slightly imperfect English, opens with a greeting like "Gentile Signor Keller". Sells the texture before the price.',
    formatting:
      'Prose with the numbers woven into sentences, one closing line inviting a call.',
    omits: ['leadTime'],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-06': {
    name: 'Marco Bellini',
    role: 'Sales Manager',
    language: 'English',
    style:
      'Sun care specialist. Leads with SPF test methodology (ISO 24444, in-vivo) and water resistance before commercials.',
    formatting:
      'An ASCII table of the specification with pipe characters, then two closing lines.',
    omits: [],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-07': {
    name: 'Anna Kowalska',
    role: 'Export Department',
    language: 'English',
    style: 'Telegraphic and efficient. Almost no courtesy, states Incoterms (EXW Gdańsk) and payment terms.',
    formatting: 'A dense bullet list of six to eight lines, no paragraphs.',
    omits: ['inci'],
    priceUnit: 'per piece ex works',
    attaches: false,
  },
  'SUP-08': {
    name: 'Céline Marchand',
    role: 'Commercial',
    language: 'English',
    style:
      'Very formal French business tone, elaborate courtesy formulas. Defers the technical detail to the attachment instead of writing it out.',
    formatting:
      'Polite prose, gives only the essential commercial figures and refers to the attached data sheet for the rest.',
    omits: ['inci', 'certifications'],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-09': {
    name: 'Julien Roux',
    role: 'Business Development',
    language: 'English',
    style:
      'R&D-driven. Talks about the active complex, its concentration and a proprietary encapsulation, mentions a patent number.',
    formatting:
      'One paragraph on the formulation, then the full INCI list, then a compact labelled block of commercials.',
    omits: [],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-10': {
    name: 'Carlos Núñez',
    role: 'Comercial',
    language: 'English with Spanish phrases',
    style:
      'Friendly Spanish sales voice, opens with "Estimado Sr. Keller", mentions the factory in Alicante and holiday shutdown in August.',
    formatting:
      'Prose with a two-line price note at the end; states quantities in pallets and pieces.',
    omits: ['leadTime'],
    priceUnit: 'per piece ex works',
    palletSize: 600,
    attaches: false,
  },
  'SUP-11': {
    name: 'Thomas Gruber',
    role: 'Verkauf',
    language: 'German',
    style:
      'Writes the entire reply in German, formal Sie-form, Austrian business tone. Precise, no filler.',
    formatting:
      'German labelled block ("Füllmenge:", "Preis:", "Mindestabnahme:", "Lieferzeit:") after a two-line intro.',
    omits: [],
    priceUnit: 'per piece',
    attaches: true,
  },
  'SUP-12': {
    name: 'Andrea Baumann',
    role: 'Project Management',
    language: 'English',
    style:
      'Swiss premium positioning. Precise, mentions the stability protocol (12 weeks at 40 °C) and that the price depends on the packaging decision.',
    formatting:
      'Structured prose with three price tiers by quantity; the requested quantity tier is stated explicitly.',
    omits: [],
    priceUnit: 'per piece',
    attaches: true,
  },
};

export const defaultPersona: SupplierPersona = {
  name: 'Sales Team',
  role: 'Sales',
  language: 'English',
  style: 'Neutral, professional.',
  formatting: 'A labelled block of specifications.',
  omits: [],
  priceUnit: 'per piece',
  attaches: true,
};

export const personaFor = (supplierId: string) => SUPPLIER_PERSONAS[supplierId] ?? defaultPersona;
