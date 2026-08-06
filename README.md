# Labtree — AI Sourcing Portal (clickable demo)

Frontend-only simulation of an AI-powered cosmetics sourcing portal for a white-label / private-label
development agency. Everything runs in the browser from in-memory mock data, persisted to
`localStorage` so a demo can be paused and resumed. Visual language follows labtree.de.

```bash
npm install
npm run dev      # http://localhost:5173
```

## What the demo shows

| Module | Route | Story |
| --- | --- | --- |
| AI briefing | `/chat` | Free text or an uploaded RFQ becomes a structured brief, live, field by field |
| Matching | `/results/:briefId` | Deterministic weighted scoring with a per-criterion breakdown |
| Samples | `/orders` | Customer-side sample orders with shipping status |
| Admin | `/admin` | Dashboard, briefs, catalog, manufacturers, sample queue |
| Sourcing | `/admin/sourcing/:briefId` | Supplier selection, AI emails, simulated replies, AI parsing, catalog write-back, automatic re-match |

Switch between **Customer view** and **Admin** in the header at any time; state is preserved.
`Reset demo` (circular arrow icon) restores the initial state.

## Suggested demo run (about 6 minutes)

1. **Scenario A — it just works.** `/chat` → starter chip "Face cream for the nose, 100 ml".
   Answer with chips. Watch the *Detected brief data* panel fill up — that is the money shot.
   Results: three products at 99/100, plus near-misses that visibly fail on volume or vegan status.
2. **Order a sample.** `Order sample` → address is prefilled → confirm. Switch to Admin →
   `Samples` → `Create label` produces a tracking number that appears instantly in the customer view.
3. **Scenario C — nothing matches.** `/chat` → `New brief` → starter chip
   "Mineral sunscreen SPF 50, 200 ml". The results page explains *why* each candidate failed
   (knockout criteria) and offers sourcing.
4. **Sourcing.** `Start sourcing` → manufacturers are pre-selected by specialisation →
   `Generate enquiries` → edit an email if you like → `Send all` → `Fast-forward`.
   Two offers, one deviating offer, one decline, one silent thread with `Follow up`.
5. **The credibility moment.** Each offer shows the raw email next to the extracted fields with
   per-field confidence; low-confidence fields are flagged for review.
   Prefer to drive this by hand? Switch the reply mode to **I write the replies** before sending.
   Nothing then arrives on a timer: you type each manufacturer's email in your own words and the
   model extracts the product data from it. A reply without commercial data is marked as declined
   instead of inventing fields.
6. **Close the loop.** `Add to catalog` → the product is created, the brief is re-matched
   automatically ("1 new match"), and the customer view now shows it with a *Newly sourced* badge.
   This is the core value story: the catalog grows with every enquiry.
7. **Scenario D — RFQ upload.** In the chat, the paperclip accepts any file (nothing is read) and
   extracts a complete brief in one shot, with per-field confidence.

## Architecture

```
src/
  types/                 all interfaces
  data/                  suppliers (12), products (80), scenarios, supplier replies, customer
  lib/matching.ts        weighted scoring, knockout criteria, top 5
  lib/ai/                provider interface + scripted provider + OpenRouter provider
  store/useStore.ts      single Zustand store, persisted
  components/            design system (shadcn-style) and shared UI
  pages/                 customer pages and admin pages
```

### Matching

Weights: category 20 · volume 20 · actives 20 · certifications 15 · price 10 · MOQ 10 · lead time 5.
Criteria the brief does not specify are dropped and the remaining weights are rescaled, so an
incomplete brief cannot inflate a score. A zero on **category** or **actives** is a knockout;
anything below 40 points is not shown. Results are the top 5, sorted descending.

### AI layer

`src/lib/ai/provider.ts` defines one interface with four methods: `chatTurn`, `draftSupplierEmail`,
`parseOffer`, `enrichProductCopy`. Two implementations:

- **`mockProvider`** — scripted. Keyword extraction and a question tree from
  `src/data/scenarios.ts`, regex parsing of offer emails. No network access.
- **`openrouterProvider`** — real model calls via `https://openrouter.ai/api/v1`. Every method falls
  back to the scripted provider on any error, so a live demo cannot break.

A key is already configured in `.env.local` (gitignored) with `openai/gpt-4.1-mini` — cheap and
reliable at structured output. `openai/gpt-5-nano` costs roughly eight times less if the demo is run
often; set it via `VITE_OPENROUTER_MODEL`. Restart the dev server after changing env values.

The header chip switches between `AI scripted` and `AI live`; with a key present, live is the default.

Because a live model phrases things freely, everything it returns passes through
`src/lib/ai/normalize.ts` (enum mapping) and the deterministic keyword extraction from
`src/data/scenarios.ts` runs underneath it as a floor — that is what keeps domain shortcuts such as
"mineral filter" landing in the actives field, which the matching relies on.

Note that the key is bundled into the client — fine for a local sales demo, not for production. A
production deployment moves `lib/ai` behind a backend route; the interface stays identical.

## Demo prep notes

- Mock data lives in plain TS files and is meant to be edited by hand: `src/data/products.ts` is
  deliberately seeded so Scenario A produces strong hits, near-misses fail visibly, and the mineral
  sunscreen request matches nothing.
- Supplier reply mix, wording and timings: `src/data/replies.ts` (delays are compressed to 4–12 s;
  `Fast-forward` fires everything instantly).
- Assistant questions, chips and keyword dictionaries: `src/data/scenarios.ts`.
- Manufacturer names are hidden from customers ("Manufacturer #4 (DE)"); the admin role can reveal
  them per card — a deliberate talking point.
- Product photography: four packaging shots in `public/products/` are mapped to products by texture
  in `src/lib/productImage.ts` (jar for creams and masks, pump bottle for lotions, gels, shampoos and
  foams, applicator tube for serums and oils, twist stick for balms and sticks). Add more photos by
  extending that map. Originals stay in `img/`.
