# RangeRates Dispatch Workspace

RangeRates is now a full Next.js 14 dispatch webapp instead of a one-screen calculator.

It still uses the live OpenStreetMap + OSRM quote engine, but now the product flow includes:

- working login + signup
- protected dashboard
- saved quote history
- quote detail pages with status + notes
- customer list + customer detail pages
- route preview + copy-ready summaries
- clear empty states and real next-action links

## What changed

The app was rebuilt around the local website template principles:

- no dead-end landing page
- no fake billing copy
- logged-in workflow from the first version
- list / detail / create flow for the main records
- every empty state points to a real next action

## Auth + storage model

This version prefers **server-backed JSON storage** when the host can write to `data/rangerates-workspace.json`.

If the deployment target is read-only or otherwise cannot save server files, the app now **falls back to browser localStorage for email/password auth and workspace data** so signup and the core dashboard still work without extra backend setup.

That means:

- writable hosts get shared server-side persistence for the app instance
- read-only hosts still allow per-browser accounts and saved workspace data
- quotes/customers persist in that browser until cleared when local fallback is active
- the app structure is still ready for a future swap to Supabase/Postgres if multi-device sync is needed

## Core workflow

1. Create an account or log in
2. Open the dashboard
3. Create a quote from `/dashboard/quotes/new`
4. Save the quote to history
5. Open quote detail to update status, urgency, notes, and copy the summary
6. Create or open customer records to keep quote history attached to real accounts

## Quote engine

The calculator still uses the original live route logic:

1. Geocode the destination + origin with OpenStreetMap Nominatim
2. Request OSRM driving distance
3. Fall back to straight-line distance if routing fails
4. Match the result against `src/lib/pricing.ts`

Origin is configured in:

- `src/lib/config.ts`

Pricing tiers are configured in:

- `src/lib/pricing.ts`

## Main routes

- `/` — public landing page aligned with the real app
- `/login` — login
- `/signup` — signup
- `/dashboard` — ops dashboard
- `/dashboard/quotes` — quote list
- `/dashboard/quotes/new` — new quote flow
- `/dashboard/quotes/[quoteId]` — quote detail
- `/dashboard/customers` — customer list
- `/dashboard/customers/new` — create customer
- `/dashboard/customers/[customerId]` — customer detail
- `/dashboard/profile` — workspace profile

## Local development

```bash
npm install
npm run dev
```

Optional OpenStreetMap contact string:

```bash
cp .env.example .env.local
```

```env
OSM_CONTACT=dispatch@example.com
```

## Build

```bash
npm run build
npm run start
```

## Notes

If you want the next pass to move from browser-local auth/storage to a real backend, the UI flow is already in place and the storage layer can be replaced without redoing the product structure.
