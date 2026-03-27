# RangeRates Delivery Distance Calculator

A RangeRates-branded Next.js 14 application that produces instant delivery fee quotes for Mac Services dispatch. The tool geocodes the destination, calculates the driving distance from **401 S Evans St, Tecumseh, MI 49286**, matches it to a transparent pricing tier, and outputs a copy-friendly summary you can send to customers.

## Highlights

- ✅ **RangeRates UI** with custom logo, light theme, and dispatcher-focused copy
- ✅ **OpenStreetMap + OSRM** pipeline with automatic straight-line fallback
- ✅ **Pricing tiers in one file** (`src/lib/pricing.ts`) for quick edits
- ✅ **Leaflet route preview** so ops can sanity-check relative distance
- ✅ **Share-ready summary string** for SMS/email replies
- ✅ **No paid API keys** – everything uses open data

## Getting Started

### 1. Install dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 2. (Optional) Add OpenStreetMap contact info

```bash
cp .env.example .env.local
```

```
OSM_CONTACT=dispatch@example.com
```

Nominatim appreciates a contact string. The app still functions without it; the User-Agent simply defaults to a generic notice.

### 3. Run locally

```bash
pnpm dev
```

Visit `http://localhost:3000`, enter a destination (e.g., `100 N Main St, Adrian, MI`), and RangeRates will return the distance, tier, fee, and shareable note.

### 4. Build & deploy

```bash
pnpm build
pnpm start
```

Deploy to any Node host or export static assets for GitHub Pages/Vercel edge.

## Folder Structure

```
rangerates-distance-calculator/
├── public/
│   └── rangerates-logo.svg
├── src/
│   ├── app/
│   │   ├── api/calculate/route.ts   # Delivery quote API
│   │   ├── globals.css             # Tailwind + theme styles
│   │   └── page.tsx                # RangeRates UI
│   ├── components/
│   │   └── map-preview.tsx         # Leaflet route preview
│   ├── lib/
│   │   ├── config.ts               # Origin + constants
│   │   ├── distance.ts             # Geocode + routing glue
│   │   └── pricing.ts              # Tier definitions
│   └── types/delivery.ts           # Shared types
├── tailwind.config.ts
├── next.config.mjs
├── package.json
└── README.md
```

## Customizing

- **Origin address** – edit `ORIGIN_ADDRESS` inside `src/lib/config.ts`.
- **Pricing tiers** – adjust `PRICING_TIERS` inside `src/lib/pricing.ts`.
- **Brand styling** – edit `tailwind.config.ts` (color tokens) + `globals.css`.
- **Map tiles** – update `TILE_URL` inside `src/components/map-preview.tsx`.

## API Behavior

1. Geocode the destination + Tecumseh origin with OpenStreetMap Nominatim.
2. Request OSRM driving distance.
3. If the router fails, compute a haversine (straight-line) fallback.
4. Match the distance against the tier table and respond with a structured payload.

## Deployment Checklist

1. (Optional) set `OSM_CONTACT` in the environment.
2. `pnpm build` → ensure the build succeeds.
3. `pnpm start` on production or export static assets (`next export`).
4. Monitor usage to stay courteous with OpenStreetMap limits.

---

RangeRates keeps delivery pricing consistent, fast, and transparent for every Mac Services route.
