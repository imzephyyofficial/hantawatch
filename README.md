# HantaWatch — Global Hantavirus Surveillance

Next.js 15 / React 19 / TypeScript / Tailwind v4 dashboard tracking hantavirus
activity worldwide. Aggregates publicly reported figures from WHO, CDC, ECDC,
and PAHO. Deployed on Vercel.

## Pages

- `/` — global dashboard (stats, world map, time series, strain donut, regional cards, alert feed)
- `/surveillance` — sortable / filterable country table with CSV + JSON export
- `/outbreaks` — active outbreaks + chronological event timeline
- `/outbreaks/[id]` — outbreak event detail
- `/country/[iso]` — country detail with peers, recent events, source links
- `/strain/[name]` — strain reference (Andes, Sin Nombre, Hantaan, Puumala, Seoul, Laguna Negra)
- `/analytics` — CFR by strain, region totals, top 10 countries, computed insights
- `/reports` — CSV / JSON exports + printable view
- `/status` — data freshness and component status

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 (CSS-first config) |
| Charts | Recharts |
| Map | d3-geo + topojson-client + world-atlas |
| Icons | lucide-react |
| OG images | @vercel/og (edge runtime) |

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run type-check
```

## Deploy

```bash
vercel              # preview
vercel --prod       # production
```

The `.vercel/` folder links to the existing Vercel project
(`hantawatch-global`). Pushing replaces the previous static deployment
with this Next.js app at the same URL.

## What's intentionally not here yet

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the work that remains —
real data ETL, alerts, auth, public API, and forecasting.

## License

MIT
