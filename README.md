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

## Database & logins (Supabase)

The live portal saves to Supabase (project `cwn-carriers`, org DataIsData, East US). The schema is in `supabase/schema.sql`; it has already been run.

- **Invite-only logins.** `invites` lists who may join a company. When someone creates an account with an invited email, a database trigger adds them to `members` with their role (owner, admin, dispatcher, driver). Owners invite people from **Fleet & Drivers → Team logins**.
- **Everything saves.** Each area of the portal (Company Brain, opportunities, loads, drivers, customers, compliance, outreach, activity) is one row in `portal_state`, saved about 0.7 s after an edit. Other signed-in devices update live (Realtime). Every save is also copied to `portal_history`, so nothing typed is lost.
- **Security.** Row Level Security on every table: users only see their own company. Drivers can only save loads and activity. Anonymous visitors see nothing.
- **Files.** BOL photos and signed PODs from the driver app go to the private `documents` storage bucket under `<company_id>/`. Dispatch opens them through short-lived signed links.
- **Demo mode.** "Try the demo" on the sign-in screen runs the sample-data demo in the browser only, for sales demos.
- **Keys.** `src/lib/supabase.ts` holds the project URL and the publishable key, which are safe in browser code. Optional overrides: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put the secret key in `src/`.
- **New carrier customer?** Insert a row in `companies` and an owner row in `invites`; the same codebase serves them.

## Team, access & messages

`supabase/002_team_messages.sql` (already run on the live project) adds:

- **DataIsData admins** (`platform_admins`: azaiah@, tony@dataisdata.com). They can open every company with the `platform` role, and see and change everything, including the owner. Add a company and every DataIsData admin can open it automatically.
- **Roles**:
  - Owner: always every page.
  - Admin: every page by default; Tequila Samuel (COO) is invited as admin.
  - Dispatcher: no Money, Brain, Briefing or Team.
  - Driver: the driver app + messages.
  - Per-person page lists live in `members.pages` (null = role default) and are edited in **Team & Access** (`/portal/team`).
  - The page list and defaults are in `src/portal/perms.ts`.
- **View as**: owners, admins and DataIsData admins can switch the whole portal to anyone's view, from the header picker or the Team page. Writes still happen as the real person.
- **Messages** (`/portal/messages`):
  - A team board where posts can be tasks with an assignee, a due date and done/pinned flags.
  - Private messages between two people. Row Level Security keeps them private, even from admins.
  - Realtime, with unread badges stored in `message_reads`.
  - Open tasks also show on Command, and drivers reach messages from their phone screen.
- **Google sign-in**: the button appears on the sign-in screen automatically once the Google provider is switched on in Supabase (Authentication → Sign In / Providers → Google). Invited emails join their company on first sign-in, whether they use Google or a password.

## Load Finder (`/portal/loads`)

One ranked list of loads from every source CWN is allowed to use. The Company Brain scores each load (equipment, weight, pallets, length, pickup date, overnight runs, insurance), and the Rate Coach (`src/brain/rate.ts`) gives a floor, a target, a counter and a call script.

- **Paste anything:** broker load-list emails, rows copied from a load board, texts. Parser: `src/brain/loadparse.ts`. City lookup: `src/brain/geo.ts` (US ZIP centroids, loaded only on this page).
- **Broker email inbox:** forward load emails (Gmail/Yahoo forwarding, Zapier, Make or n8n) to:
  ```
  POST https://<site>/api/inbox
  x-ingest-key: <INGEST_KEY>
  { "text": "<email body>", "subject": "...", "from": "Broker name <email>", "source": "Broker email" }
  ```
  Plain-text bodies work too. The portal's "Check inbox" button pulls new messages and turns them into scored loads.
- **Weekly sweep:** loads can also arrive through `/api/ingest` as `kind: "load"` items.
- **Book it:** booking a load creates a Dispatch card (status Booked) and moves it to Won in the Pipeline.
- **Never scrape paid boards.** DAT's terms ban bots and scraping. Connect a customer's own DAT/Truckstop account only through their official partner APIs.

## Pipeline (`/portal/pipeline`)

Every load, bid, lead and partner program on one board (New → Reviewing → Working it → Sent → Won/Booked → Lost), labeled by kind. Stage words change per kind (`src/portal/stages.ts`).

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

## Assets

The logo (`public/assets/cwn-logo-light.svg` / `cwn-logo-dark.svg`) is vectorized from CWN's truck-door decal. Textures are code-generated placeholders. See `KIE_ASSET_PROMPTS.md` to swap in Kie AI renders with the same filenames.
