# CWN Carriers: website, operations portal & Company Brain

Built by DataIsData for **Commonwealth Nationwide Carriers LLC** (Lawrence Samuel), Chesterfield, VA. USDOT 4444839, MC 1750751.

One Vite + React 18 + TypeScript + Tailwind 3 app:

| Path | What it is |
|---|---|
| `/` | Public website: home, services, ship with us (3-step quote), brokers (carrier packet), drive for CWN, about, contact |
| `/portal` | Operations portal: command center, dispatch board, bids & leads, Company Brain, outreach, weekly briefing, fleet & drivers, customers, money (incl. truck #3 calculator), compliance vault, documents, driver app |

## Open, push, deploy

1. Open this folder (`cwn-carriers-app`) in Cursor.
2. `npm install` then `npm run dev`. The site is at http://localhost:5173 and the portal at /portal.
3. Push to GitHub:
   ```bash
   git init && git add . && git commit -m "CWN Carriers website + portal"
   gh repo create azaiah/cwn-carriers --private --source=. --push
   ```
4. Netlify → Add new site → Import from GitHub → pick the repo. Build settings come from `netlify.toml`.
5. Add the environment variables below, then redeploy.

## Run it

```bash
npm install
npm run dev            # local dev
npm run build          # production build → dist/ (Netlify)
npm run build:preview  # hash-routed, relative-path build → dist-preview/ (static previews)
```

## Deploy (Netlify)

`netlify.toml` is ready. Build `npm run build`, publish `dist`, functions in `netlify/functions`.

Environment variables:

| Var | Needed? | What it does |
|---|---|---|
| `INGEST_KEY` | Yes, for live sweeps | Shared secret the weekly bid & lead sweep uses to post results to `/api/ingest`. Any long random string. |
| `ANTHROPIC_API_KEY` | Optional | Powers "Rewrite with AI" in Outreach. Templates work without it. Add the portal password first, because this endpoint is open. |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-sonnet-5-5` |
| `SAM_API_KEY` | Optional | Direct SAM.gov API pull. Not needed, since the research sweep already covers SAM.gov. |

## Bid & lead sweeps

Same model as CSL and Gundy: a scheduled research sweep (a Claude scheduled task) searches SAM.gov, Virginia eVA, USPS contract routes, Chesterfield/Richmond procurement, new warehouses and shippers, and broker/partner programs every week. It scores nothing itself; it posts raw opportunities to:

```
POST https://<site>/api/ingest
x-ingest-key: <INGEST_KEY>
{ "items": [ Opportunity, ... ] }   // shape: src/brain/types.ts
```

The portal pulls them on "Run sweep now" (from `/api/opps`) and the Company Brain scores them against CWN's profile.

Netlify Forms are pre-registered in `index.html`: `quote`, `broker`, `driver`, `contact`.

## The Company Brain

- `src/brain/cwn.ts`: CWN's profile. Facts marked verified come from FMCSA records (Nov 2026). `unknowns` lists what Lawrence still needs to confirm (drives the Knowledge meter).
- `src/brain/score.ts`: the scorer. Hard stops first (hazmat, CDL-only, 53'/reefer/flatbed, insurance minimums, set-asides CWN can't claim, never-haul list), then six weighted factors: fit, profit (rate/mi vs floor), distance from HQ, recurrence, winnability, urgency. Every point comes with a plain-English reason.
- `src/brain/seed.ts`: the starting feed.
  - **Real prospects** (`sample: false`): researched organizations with source links (Dover Food Retail parts hub, CEVA final-mile program, Amazon Relay, Whitepine Logistics Center, Live! Casino build-out, Commonwealth Courier teaming, Google data center site, plus Sabra and Mondelēz to show what the Brain passes on).
  - **Sample bids/loads** (`sample: true`): show the exact format the live sweep produces. They're labeled "Sample" in the UI and get replaced once `SAM_API_KEY` is set.
- `netlify/functions/lib/sam.mjs`: SAM.gov Opportunities API sweep (NAICS 484110, 484122, 484220, 492110, 492210, 484210 · VA/NC/MD/DC).

## What's demo vs real

- **Real:** company facts, insurance, authority, contact info, logo, prospects and their sources.
- **Demo:** loads, customers, drivers' names/phones, invoices. The portal shows a "Demo data" badge. Data is stored in the browser (localStorage) for the demo. Next step: move it to Netlify Blobs or a database with real logins (same pattern as the Gundy Command Center).

## For Lawrence to confirm before launch

- Story on the About page (`src/site/About.tsx`) in his own words, plus a headshot and real truck photos
- Business hours (`src/site/config.ts`)
- Truck specs: box length, liftgate on 101/102, max pallets/weight
- Cargo insurance and general liability limits
- Rate floor, cost per mile, weekly target (Company Brain → Money rules, currently assumed)
- Service promises on the site: same-day POD & invoice, status texts, inside delivery
- A business email on a CWN domain (currently the FMCSA-listed Yahoo address)

## Assets

The logo (`public/assets/cwn-logo-light.svg` / `cwn-logo-dark.svg`) is vectorized from CWN's truck-door decal. Textures are code-generated placeholders. See `KIE_ASSET_PROMPTS.md` to swap in Kie AI renders with the same filenames.
