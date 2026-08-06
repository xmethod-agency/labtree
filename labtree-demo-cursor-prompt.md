# Cursor Prompt — Labtree AI Sourcing Portal (Frontend-Only Demo)

Copy everything below into Cursor as the initial instruction.

---

## Project brief

Build a **frontend-only, fully mocked simulation** of an AI-powered cosmetics sourcing portal. No backend, no database, no deployment, no real AI calls, no images. Everything runs in the browser from in-memory mock data. This is a **clickable demo for a sales meeting** — it must feel real and complete, not like a wireframe.

**Business context:** The client is a German white-label/private-label cosmetics development agency. They sit between cosmetic brands (customers) and manufacturers (suppliers). A customer describes a product they want ("I need a 100ml nose cream, vegan, panthenol-based"), and the agency matches it against a supplier catalog. When nothing matches, the agency emails suppliers, gets offers back, and adds those products to the catalog. Today this is 100% manual. The demo shows what it looks like automated.

**Two user roles, switchable at any time from a persistent header control:**
- **Customer** — submits briefs, chats, browses matches, orders samples
- **Admin** (agency staff) — reviews briefs, manages catalog, runs supplier sourcing, handles sample orders

---

## Tech stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** for styling
- **React Router** for routing
- **Zustand** for global state (single store, persisted to `localStorage` so a demo can be paused and resumed)
- **lucide-react** for icons
- No other UI libraries. Build components by hand.

Project must run with `npm install && npm run dev` and nothing else.

---

## Design direction

Do **not** produce a generic SaaS dashboard. Concrete direction:

- **Subject world:** cosmetic formulation — lab notation, INCI ingredient lists, batch codes, fill volumes, certification marks. Structure should look like a **technical spec sheet**, not a marketing page.
- **Palette:** cool clinical base (off-white `#FAFAF8`, ink `#1A1D1A`), one saturated accent used sparingly for actions and match scores, one muted secondary for supplier/sourcing context. Pick specific hexes and define them as CSS variables in `index.css`. Avoid warm-cream + terracotta and avoid dark-mode-with-acid-green.
- **Type:** two families max — a characterful display/mono-ish face for numbers, SKU codes, match scores, and volumes; a clean neutral sans for body. Numbers matter in this product — treat them typographically (tabular figures, deliberate scale).
- **Signature element:** the **match score** visualization on product cards. It should not be a plain progress bar. Make it encode *why* a product matched — a per-criterion breakdown (volume / ingredients / certifications / price / MOQ / lead time) that a user can read at a glance.
- Since there are no photos, product cards must be carried entirely by typography and data density. Lean into that — it reads as more technical and credible, which suits the audience.
- **UI language: German.** This is a German B2B audience. All labels, buttons, chat copy, and email templates in German. Keep code identifiers and comments in English.
- Quality floor: responsive down to tablet, visible keyboard focus, `prefers-reduced-motion` respected.

---

## Data models

Put all types in `src/types/index.ts` and all mock data in `src/data/`.

```ts
type LabelType = 'white_label' | 'private_label';
type Certification = 'vegan' | 'cruelty_free' | 'organic_cosmos' | 'derm_tested' | 'halal' | 'fragrance_free';

interface Supplier {
  id: string;
  name: string;              // e.g. "Kosmetik Werke Rhein GmbH"
  country: string;           // DE, IT, PL, FR, ES
  contactEmail: string;
  specialties: string[];     // categories they cover
  avgResponseDays: number;   // 1–7, used for the email simulation
  reliabilityScore: number;  // 0–100, shown in admin only
  productCount: number;
}

interface Product {
  id: string;                // SKU, e.g. "KWR-FC-0412"
  supplierId: string;
  name: string;              // German product name
  category: string;          // 'Gesichtspflege' | 'Körperpflege' | 'Haarpflege' | 'Sonnenschutz' | 'Spezialpflege'
  subCategory: string;       // 'Creme' | 'Serum' | 'Balsam' | 'Lotion' | 'Gel' | 'Öl'
  applicationArea: string[]; // ['Gesicht', 'Nase', 'Lippen', 'Hände', ...]
  volumeMl: number;
  keyIngredients: string[];  // ['Panthenol', 'Sheabutter', 'Hyaluronsäure', ...]
  inciExcerpt: string;       // short realistic INCI string
  certifications: Certification[];
  labelTypes: LabelType[];
  priceMin: number;          // € per unit
  priceMax: number;
  moq: number;               // 100 / 250 / 500 / 1000 / 2500
  leadTimeWeeks: number;
  inStockSamples: boolean;
  description: string;       // 2–3 sentences, marketing-enriched German copy
  source: 'catalog' | 'sourced';  // 'sourced' = created during this demo session
  createdAt: string;
}

interface Brief {
  id: string;                // e.g. "BR-2026-0147"
  createdAt: string;
  status: 'draft' | 'matching' | 'matched' | 'sourcing' | 'completed';
  raw: string;               // original customer input
  inputMethod: 'chat' | 'pdf' | 'excel' | 'form';
  // structured fields — null means "not yet known", drives the AI follow-up questions
  category: string | null;
  subCategory: string | null;
  applicationArea: string[] | null;
  volumeMl: number | null;
  keyIngredients: string[] | null;
  certifications: Certification[] | null;
  labelType: LabelType | null;
  targetPriceMin: number | null;
  targetPriceMax: number | null;
  quantity: number | null;
  notes: string | null;
  matchIds: string[];        // resolved product ids
}

interface MatchResult {
  productId: string;
  totalScore: number;        // 0–100
  breakdown: {
    criterion: 'volume' | 'ingredients' | 'certifications' | 'price' | 'moq' | 'leadTime' | 'category';
    score: number;           // 0–100
    weight: number;
    verdict: 'match' | 'partial' | 'mismatch';
    note: string;            // German, e.g. "50ml statt 100ml"
  }[];
}

interface SampleOrder {
  id: string;                // "SO-2026-0088"
  briefId: string;
  productId: string;
  customerName: string;
  shippingAddress: { name: string; company: string; street: string; zip: string; city: string; country: string; };
  status: 'requested' | 'label_created' | 'shipped' | 'delivered';
  trackingNumber: string | null;
  createdAt: string;
  statusHistory: { status: string; timestamp: string }[];
}

interface EmailThread {
  id: string;
  briefId: string;
  supplierId: string;
  status: 'draft' | 'sent' | 'awaiting_reply' | 'replied' | 'parsed' | 'declined';
  messages: EmailMessage[];
  parsedOffer: ParsedOffer | null;
}

interface EmailMessage {
  id: string;
  direction: 'outbound' | 'inbound';
  from: string;
  to: string;
  subject: string;
  body: string;              // German
  timestamp: string;
  attachmentName?: string;   // e.g. "Datenblatt_KWR-FC-0891.pdf" — decorative, non-functional
}

interface ParsedOffer {
  productName: string;
  volumeMl: number;
  keyIngredients: string[];
  certifications: Certification[];
  priceMin: number;
  priceMax: number;
  moq: number;
  leadTimeWeeks: number;
  labelTypes: LabelType[];
  confidence: number;        // 0–100, shown as "KI-Extraktionsgenauigkeit"
  needsReview: boolean;
}
```

---

## Mock data requirements

`src/data/suppliers.ts` — **12 suppliers**, realistic German/EU cosmetics manufacturer names, varied countries and specialties.

`src/data/products.ts` — **60–80 products** spread across suppliers. Requirements:
- Realistic German names ("Regenerierende Gesichtscreme mit Panthenol")
- Realistic INCI excerpts ("Aqua, Glycerin, Panthenol, Butyrospermum Parkii Butter, Tocopherol...")
- Deliberately seeded so the demo scenarios below produce the intended outcomes:
  - **≥3 products** that score high on "100ml Nasen-/Gesichtscreme, vegan, Panthenol"
  - **≥2 products** that are near-misses (right composition, 50ml volume; or right volume, not vegan)
  - **0 products** matching a niche scenario (e.g. "Sonnenschutz LSF 50 mit mineralischem Filter, 200ml, Organic COSMOS") so the sourcing flow can be demonstrated
- Vary MOQ, price, lead time so the score breakdown looks non-uniform

`src/data/scenarios.ts` — the scripted chat flows (see below).

`src/data/customer.ts` — a mock logged-in customer ("Lena Brandt, Aurelia Naturkosmetik GmbH, Hamburg") with prefilled shipping address.

---

## Module 1 — AI chat (scripted, no real LLM)

Route: `/chat` (customer role)

**Behavior:** a chat interface that *looks* like an AI assistant but runs a decision tree defined in `src/data/scenarios.ts`.

**Matching input to a scenario:** on each customer message, run keyword matching against scenario triggers. If nothing matches, fall back to a generic clarification path. Do NOT require exact string matches — match on keyword sets (e.g. `['creme', 'nase']`, `['sonnenschutz', 'lsf']`).

**Realism requirements:**
- Typing indicator with a 600–1200ms delay before each assistant message
- Assistant messages stream in character-by-character (or word-by-word) — this sells the "AI" feel more than anything else
- A collapsible **"Erkannte Brief-Daten"** panel beside/below the chat that fills in live as fields are extracted. Newly extracted fields highlight briefly. This is the single most persuasive element of the demo — the client sees unstructured text becoming structured data in real time.
- Quick-reply chips for common answers so a demo can be driven without typing
- Free-text input still works and is keyword-matched

**Scenario A — happy path (primary demo):**

1. Customer: "Ich brauche eine Creme für die Nase, 100ml"
2. Assistant extracts: `subCategory: Creme`, `applicationArea: [Nase]`, `volumeMl: 100`. Panel updates.
3. Assistant asks the disambiguating question: pflegende Gesichtscreme für den Nasenbereich, or Nasenbalsam (medizinnah)? → chips
4. Customer picks "Gesichtscreme"
5. Assistant asks for key ingredients → chips: Panthenol / Hyaluronsäure / Sheabutter / Weiß ich noch nicht
6. Assistant asks certifications → multi-select chips
7. Assistant asks label type (White-Label / Private-Label) with a one-line explanation of the difference
8. Assistant asks quantity and target price
9. Assistant: "Ich durchsuche jetzt 2.847 Produkte von 12 Herstellern…" → 2s loading state with a visible step sequence (Filter anwenden → Semantische Suche → Bewertung → Ranking)
10. → navigate to results

**Scenario B — near-miss:** trigger with an unusual volume (e.g. 250ml). Results screen shows partial matches with explicit mismatch labels, plus a prominent **"Bei Herstellern anfragen"** CTA.

**Scenario C — no match:** trigger with the seeded niche request (mineralischer Sonnenschutz LSF 50, 200ml, Organic COSMOS). Assistant states plainly that nothing in the catalog fits and offers supplier sourcing. → sourcing flow.

**Scenario D — file upload:** a "Datei hochladen" button. Selecting *any* file (or clicking a mock file chip) triggers a scripted "PDF wird analysiert…" sequence that extracts a full brief in one shot and shows the extracted fields with per-field confidence. Never actually read the file.

**Scenario E — out of scope:** if the message contains obviously non-cosmetic keywords, the assistant politely redirects.

---

## Module 2 — Matching & product cards

Route: `/results/:briefId` (customer role)

**Scoring must be real deterministic code**, not hardcoded results. `src/lib/matching.ts`:

```
Weights: category 20 | volume 20 | ingredients 20 | certifications 15 | price 10 | moq 10 | leadTime 5
```

- **Volume:** exact = 100; within ±20% = 70 with note ("80ml statt 100ml"); otherwise scaled down
- **Ingredients:** proportion of requested ingredients present in `keyIngredients`
- **Certifications:** all present = 100; each missing one deducts proportionally; note which are missing
- **Price:** overlap between requested range and product range
- **MOQ:** product MOQ ≤ requested quantity = 100; above = 0 with note ("MOQ 1.000 Stück, angefragt 500")
- Products scoring **< 40** are excluded entirely
- Return top 5, sorted descending

**Product card must show:**
- SKU code and product name
- The **match score** as the signature visual — total score plus the per-criterion breakdown, with mismatches clearly readable (this is what makes the demo credible: the user sees *why* it matched)
- Volume, MOQ, lead time, price range as prominent tabular data
- Certification marks as compact text badges (no image assets)
- Key ingredients and truncated INCI (expandable)
- Supplier name — with a **"Herstellernamen anzeigen"** toggle in the admin role only; customers see "Hersteller #4 (DE)" (this is a real business question for the agency and showing it as a toggle is a good talking point)
- `Muster bestellen` primary action
- If `source === 'sourced'`, a small badge "Neu beschafft"

**Sample order flow:** click `Muster bestellen` → modal with prefilled customer address, editable → confirm → creates a `SampleOrder`, shows an order ID, and immediately appears in the admin sample queue. Show a success state that names the next step ("Ihr Muster wird innerhalb von 2 Werktagen versendet").

---

## Module 3 — Email sourcing simulation

Routes: `/admin/sourcing` and `/admin/sourcing/:briefId`

This is the module that most differentiates the demo. Flow:

**Step 1 — Supplier selection.** Given a brief with no matches, the system pre-selects relevant suppliers by category overlap (e.g. 5 of 12) with a reason line for each ("Spezialisierung: Sonnenschutz, 34 Produkte"). Admin can toggle selection.

**Step 2 — Email generation.** For each selected supplier, generate a German email from a template populated with brief fields. Show it in a real-looking composer (From / To / Subject / Body). Admin can edit the body. Include a **"KI-generiert"** marker and an **"Alle senden"** action.

Template:

```
Betreff: Produktanfrage — {subCategory} {volumeMl}ml ({certifications})

Sehr geehrte Damen und Herren,

für einen unserer Kunden suchen wir folgendes Produkt:

• Kategorie:        {category} / {subCategory}
• Anwendung:        {applicationArea}
• Füllmenge:        {volumeMl} ml
• Wirkstoffe:       {keyIngredients}
• Zertifizierungen: {certifications}
• Label:            {labelType}
• Zielmenge:        ab {quantity} Stück
• Zielpreis:        {targetPriceMin}–{targetPriceMax} € / Stück

Bitte senden Sie uns Ihr Angebot inkl. Datenblatt und INCI-Liste.

Mit freundlichen Grüßen
{agencyName}
```

**Step 3 — Simulated replies.** After sending, replies arrive on timers scaled to `avgResponseDays` (compress to **4–12 seconds** for the demo — do not make the presenter wait). Add a **"Zeit vorspulen"** button that fires all pending replies instantly; a live demo must never stall.

Reply mix — write realistic German supplier emails:
- **2 positive offers** with concrete product data in the body (name, INCI, price, MOQ, lead time)
- **1 offer with a deviation** (e.g. only 150ml available, or MOQ 2.000)
- **1 decline** ("Leider können wir dieses Produkt derzeit nicht anbieten")
- **1 no reply** (stays `awaiting_reply` with a "Nachfassen" action)

**Step 4 — AI parsing.** When a reply arrives, show an "KI extrahiert Produktdaten…" state, then render the extracted `ParsedOffer` **side by side with the raw email**, with each field individually confirmable/editable and a confidence percentage. Low-confidence fields flagged for review. This side-by-side is the credibility moment — it shows the human stays in control.

**Step 5 — Catalog write.** `Ins Katalog übernehmen` creates a new `Product` with `source: 'sourced'`, auto-generates German marketing copy from a template, assigns categories/tags, and generates a mock product data sheet (a rendered detail view, not a real PDF export).

**Step 6 — Re-match.** After adding, automatically re-run matching for the original brief and show the result: "Brief BR-2026-0151: 3 neue Treffer". The customer view now shows these products. **Demonstrating this loop — a request that found nothing now finds something, and future requests will too — is the core value story. Make it explicit in the UI.**

---

## Module 4 — Admin

Route: `/admin/*`

- **Dashboard** — counts of open briefs, running sourcing threads, pending sample orders, catalog size (with "davon X in dieser Sitzung beschafft"), suppliers. Recent activity feed. No fake charts unless they carry real mock data.
- **Briefs** — table of all briefs with status, source, match count; row click opens the brief with its full extracted data, the chat transcript, and match results
- **Catalog** — filterable/sortable table of all products; filters by category, supplier, certification, MOQ, volume, source; inline edit; manual add; `sourced` products visually distinguished
- **Suppliers** — list with response rate, product count, avg lead time, reliability; detail view lists their products and past threads
- **Sample orders** — queue with status advancement (`requested → label_created → shipped → delivered`); "Etikett erstellen" generates a mock tracking number; status changes are visible in the customer view
- **Sourcing** — all email threads with status, per Module 3

---

## Role switching

Persistent control in the header: `Kundenansicht ⇄ Admin`. Switching must be instant, preserve all state, and change navigation and permissions. Include a small persistent **"Demo"** marker so nobody in the meeting mistakes it for production.

Add a **"Demo zurücksetzen"** action that restores the initial mock state.

---

## Routes

```
/                       → redirect by role
/chat                   → customer: AI chat
/results/:briefId       → customer: matches
/orders                 → customer: their sample orders + status
/admin                  → dashboard
/admin/briefs           → brief list
/admin/briefs/:id       → brief detail
/admin/catalog          → product table
/admin/catalog/:id      → product detail / edit
/admin/suppliers        → supplier list
/admin/suppliers/:id    → supplier detail
/admin/sourcing         → email threads
/admin/sourcing/:briefId→ thread detail with parsing
/admin/samples          → sample order queue
```

---

## Build order

1. Types, mock data, Zustand store, routing shell, role switcher, design tokens
2. Matching engine + product cards + results page (test with a hardcoded brief before wiring the chat)
3. Chat module with scripted scenarios and the live extraction panel
4. Email sourcing simulation with parsing and catalog write-back
5. Admin screens
6. Sample order flow end to end
7. Polish: streaming text, loading sequences, transitions, empty states, keyboard focus

---

## Rules

- No backend calls of any kind. No `fetch`. No API keys.
- No image assets. Typography and data carry the design.
- Every number displayed must come from mock data or computed logic — no hardcoded display values that contradict state.
- Empty states and error states must be written, not left blank.
- Every action that changes state must produce visible feedback.
- Keep the mock dataset in plain TS files so it can be edited by hand during demo prep.
- Write it so that swapping `src/lib/matching.ts` and `src/lib/aiChat.ts` for real API calls later is a contained change — keep those interfaces clean.
