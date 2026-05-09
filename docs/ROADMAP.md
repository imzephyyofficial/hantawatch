# HantaWatch Roadmap

This file tracks what's shipped vs. what's planned. Updated when phases land.

## Shipped

### Phase 1 — Foundation ✅
- Next.js 15 App Router migrated from single-file static HTML
- TypeScript strict mode; Tailwind v4 (CSS-first)
- shadcn-style component primitives (Card, Button, Badge) without the CLI
- next/font for Inter + JetBrains Mono (zero CLS, self-hosted)
- Theme toggle (dark / light) with localStorage persistence
- Mobile hamburger nav, skip link, ARIA, reduced-motion, focus rings
- Print stylesheet
- CSP headers via `next.config.ts`

### Phase 3 — Visualizations ✅
- World choropleth map (d3-geo + topojson + **self-hosted** world-atlas, no CDN dep)
- Time series with stacked / single-region toggle (Recharts)
- Strain donut, CFR-by-strain bar, region bar, top-10 horizontal bar
- Forecast chart (history + 4-week linear regression projection, R² + slope shown)

### Phase 4 — Detail pages ✅
- `/country/[iso]` — profile, per-million metrics, recent events, peer countries (12 prerendered)
- `/outbreaks/[id]` — event detail, source citation, related events (8 prerendered)
- `/strain/[name]` — virology, reservoir, geographic range, current reporting (6 prerendered)
- `/compare?c=…` — 2–4 country side-by-side comparator with shareable URL state
- `/risk` — composite risk-index leaderboard with driver breakdown

### Phase 6 — SEO, distribution, structured data ✅
- `app/sitemap.ts` — every route incl. detail pages, risk, compare
- `app/robots.ts`, `app/manifest.ts` (PWA-ready)
- **Per-page OG image generators** at `/api/og`, `/api/og/country/[iso]`,
  `/api/og/outbreak/[id]`, `/api/og/strain/[name]` (edge runtime)
- **JSON-LD structured data** on every page: `Organization` + `Dataset` in
  the root layout; `Place` + property values per country; `Event` per
  outbreak; `MedicalCondition` per strain
- Per-page `generateMetadata` with canonical URLs, OG, and Twitter cards

### Phase 7 — Operations ✅ (most)
- `/status` page (data freshness, component status table)
- README + this roadmap
- next.config.ts security headers
- **Vercel Web Analytics** + **Speed Insights** wired into root layout
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — typecheck + build on push/PR
- **Error boundary** (`app/error.tsx`) with Sentry-ready hook (just set
  `NEXT_PUBLIC_SENTRY_DSN`)
- **Daily cron** (`/api/cron/refresh`) registered in `vercel.json` with
  `CRON_SECRET` auth gate

### Phase 8 partial — Differentiators ✅
- **Public API v1**: `/api/v1/countries` (CSV+JSON, region/status filters),
  `/api/v1/outbreaks` (since/severity filters), `/api/v1/strains`,
  `/api/v1/metrics` (top-line aggregates + risk top-5). All cached
  `s-maxage=3600`, CORS open
- **Atom RSS feed** at `/api/rss/outbreaks`
- **Risk index**: composite of cases × CFR × per-capita × recency, exposed
  in `/risk` page, on country detail OG image, and `/api/v1/metrics`
- **Forecasting**: pure-TS linear regression, `lib/forecast.ts`, with
  `<ForecastChart>` component (history + projection, R² + trend shown)
- **Compare mode**: URL-driven country comparison, copy-share-link button

### Phase 2 — Real data ETL ✅ (scaffolding only)
- `lib/db/client.ts` — graceful no-op until Neon provisioned
- `lib/db/schema.ts` — Drizzle table definitions (commented until install)
- `lib/etl/{who,cdc,ecdc,paho}.ts` — adapter contract + stubs
- `app/api/cron/refresh/route.ts` — runs all adapters, returns summary,
  reports DB readiness, reserves slot for `revalidateTag("dashboard")`
  once Phase 2 lights up

---

## Outstanding

### Phase 2 — wire the ETL to live data *(highest impact remaining)*

Scaffolding is in place. To finish:

1. **Provision Neon Postgres** in Vercel Marketplace (one click, injects
   `DATABASE_URL`). *Needs your action.*
2. `npm install drizzle-orm @neondatabase/serverless drizzle-kit`
3. Uncomment imports + tables in `lib/db/{client,schema}.ts`
4. `drizzle-kit generate && drizzle-kit migrate`
5. Implement parsing in `lib/etl/who.ts` (RSS XML), `cdc.ts` + `paho.ts`
   (HTML scraping with cheerio), `ecdc.ts` (PDF extract or manual override)
6. In the cron route: upsert each adapter's records, write `fetch_log`,
   `revalidateTag("dashboard")`
7. Replace `surveillanceData` reads in pages with DB queries (the page
   shape doesn't change — just the import in `lib/data.ts`)
8. Backfill 2020–2025 historical data from a checked-in `data/seed.json`

**Estimate:** 2–3 days. Adapters are the time sink — sources break.

### Phase 5 — Auth, alerts, subscriptions

1. **Provision Clerk** + **Resend** via Vercel Marketplace. *Needs your action.*
2. `<ClerkProvider>` in root layout; sign-in / sign-up routes.
3. DB tables `users`, `subscriptions` (filter + channel + target).
4. Cron-driven dispatch: diff new events vs. last run, match to active
   subscriptions, queue Resend sends.
5. Slack & generic webhooks as alternative channels.
6. `/account` page — manage subscriptions, generate API keys.

### Phase 7 — remaining ops

- **GitHub remote**: needs you to create `hantawatch` repo on github.com.
  Then `git remote add origin … && git push -u origin main`. Hooks Vercel
  Git Integration → preview deployments per PR.
- **Sentry** — provision in Vercel Marketplace, set `NEXT_PUBLIC_SENTRY_DSN`
  (the error boundary already calls `window.Sentry?.captureException` if present).
- **Playwright smoke** — add `npx playwright test` step to `.github/workflows/ci.yml`
  once `e2e/` tests are written.

### Phase 8 — remaining future bets

- **Annotation system**: auth'd contributors annotate spikes with source
  links. Blocked on Phase 5.
- **Per-country sparklines** on country detail page. Blocked on Phase 2
  historical data.
- **API rate limiting** with Vercel's KV or Upstash.
- **Embeddable widget builder** — per-chart iframe + script snippet.
- **Forecasting**: current pure-TS regression is naïve; upgrade to
  ARIMA/Prophet via a Python edge service or a TS lib like `simple-statistics`
  for moving averages with confidence intervals.

---

## What's blocked on you

| Blocker | One-click? |
|---|---|
| Neon Postgres provisioning | Yes — Vercel Marketplace |
| Clerk provisioning | Yes — Vercel Marketplace |
| Resend provisioning | Yes — Vercel Marketplace |
| Sentry provisioning | Yes — Vercel Marketplace |
| GitHub repo creation | Manual on github.com |
| Pro plan upgrade (if you want sub-daily crons) | Vercel billing |

Everything else I can ship. Tell me which to take next.
