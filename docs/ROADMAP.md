# HantaWatch Roadmap

This file tracks what's shipped vs. what's planned. Updated when phases land.

## Shipped

### Phase 1 — Foundation ✅
- Next.js 15 App Router migrated from single-file static HTML
- TypeScript strict mode
- Tailwind v4 with CSS-first theme (`@theme`)
- shadcn-style component primitives (Card, Button, Badge) without the CLI
- next/font for Inter + JetBrains Mono (zero CLS, self-hosted)
- Theme toggle (dark / light) with localStorage persistence
- Mobile hamburger nav
- Skip-to-content, ARIA labels, reduced-motion support, focus rings
- Print stylesheet
- CSP headers via `next.config.ts`

### Phase 3 — Visualizations ✅
- World choropleth map (`d3-geo` + world-atlas topojson, hover tooltips, status colors)
- Time series with stacked / single-region toggle (Recharts)
- Strain donut with legend
- CFR-by-strain bar (color-coded by tier)
- Region bar
- Top 10 countries horizontal bar

### Phase 4 — Detail pages ✅
- `/country/[iso]` — profile, per-million metrics, recent events, peer countries
- `/outbreaks/[id]` — event detail, source citation, related events
- `/strain/[name]` — virology overview, reservoir, geographic range, current reporting
- `notFound()` on all detail routes
- `generateStaticParams` on all detail routes for prerendering

### Phase 6 — SEO & Distribution ✅ (most)
- `app/sitemap.ts` — generates entries for every route including detail pages
- `app/robots.ts`
- `app/manifest.ts` (PWA-ready)
- Dynamic OG image at `/api/og` (edge runtime, generates social card from current totals)
- Per-page Metadata with `generateMetadata` on detail routes
- Structured `metadataBase` + Open Graph defaults

### Phase 7 — Operations ✅ (partial)
- `/status` page (data freshness, component status table)
- README + this roadmap
- next.config.ts security headers (X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy)

---

## Outstanding work, prioritized

### Phase 2 — Real data ETL  *(highest impact, requires database)*

The dashboard still reads from `lib/data.ts` fixtures. The plan to make this
real:

1. **Provision Neon Postgres** via Vercel Marketplace (auto-injects
   `DATABASE_URL`). User has to click Connect in the dashboard once.
2. **Add Drizzle ORM**:
   - `lib/db/schema.ts` — `countries`, `surveillance_records`, `events`, `strains`
   - `lib/db/client.ts` — pooled neon-http client
   - Migration: `drizzle-kit generate` + `drizzle-kit migrate`
3. **Adapter per source** in `lib/etl/`:
   - `who.ts` — parse Disease Outbreak News RSS, filter for hantavirus
   - `cdc.ts` — scrape `cdc.gov/hantavirus/surveillance` (table or MMWR weekly)
   - `ecdc.ts` — annual epi report (PDF or HTML table)
   - `paho.ts` — country reports
   - Each adapter outputs uniform `SurveillanceRecord[]`
4. **Vercel Cron Job** in `app/api/cron/refresh/route.ts`:
   - Runs every 6h (`vercel.json` `crons` field)
   - Calls each adapter, upserts records, writes a `fetched_at`
   - Calls `updateTag("dashboard")` to invalidate cache
5. **Switch pages to read from DB** via Cache Components (`"use cache"` with
   `cacheLife("hours")`, `cacheTag("dashboard")`)
6. **Backfill**: historical 2020–2025 numbers seeded once from a checked-in JSON.

**Estimate:** 2–3 days. The scrapers are the time sink — sources are
inconsistent and break.

### Phase 5 — Auth, alerts, subscriptions

1. **Clerk** via Vercel Marketplace (auto env). Add `<ClerkProvider>` to root
   layout. Sign-in / sign-up routes.
2. **Subscription model** (DB tables):
   - `users` (clerk_id, email, created_at)
   - `subscriptions` (user_id, region | strain | severity_min, channel, target)
3. **Resend** for email delivery (Vercel Marketplace integration).
4. **Cron-driven dispatch**: every cron run, diff new events vs. last run,
   match against active subscriptions, queue Resend sends.
5. **Slack & generic webhooks** as alternative channels.
6. **Public RSS** at `/api/rss/outbreaks` — Atom feed of last 30 days of events.
7. **Account page** `/account` — manage subscriptions, generate API keys.

**Estimate:** ~1 day if sources are predictable, 2 if subscription matching
needs anything fancy.

### Phase 7 — Operations (remaining)

- **GitHub repo + remote**: requires user to create the empty repo. Then push,
  hook into Vercel Git Integration, get preview deployments per PR.
- **CI** (GitHub Actions): typecheck + lint + Playwright smoke + a11y check.
- **Sentry** for runtime errors (Vercel Marketplace).
- **Vercel Speed Insights + Web Analytics** — one-click in the dashboard.
- **Vercel Agent** for AI PR review and anomaly investigation.

### Phase 8 — Future bets

- **Compare mode**: stack 2–4 countries on every chart, sharable URL.
- **Annotation system**: auth'd contributors annotate spikes with source links.
- **Forecasting**: 4-week ARIMA / Prophet projection per region, clearly
  labeled as model output. Likely a small Python service called from a Next.js
  route, or use a lightweight TS lib.
- **Risk index**: composite per country (cases × CFR × density × travel
  volume).
- **Public API** (`/api/v1/...`): rate-limited, free tier + paid tier with
  higher limits. Document with OpenAPI.
- **Embeddable widget builder**: per-chart iframe + script snippet for
  journalists / researchers.

### Misc polish

- Replace JSDelivr-hosted topojson fetch with a build-time import of
  `world-atlas/countries-110m.json` (drops one CDN dependency, faster first
  paint).
- Per-country sparklines on the country detail page (needs historical data —
  blocked on Phase 2).
- "Compare with last week" deltas on stat cards (also Phase 2).
- Dynamic OG images per country / outbreak / strain (current OG only renders
  global summary).
- Structured data (JSON-LD): `Dataset`, `MedicalCondition`, `Event` schemas
  on relevant pages — gets HantaWatch into Google's dataset search.
- Storybook for the component library if we keep growing it.

---

## What I can't do without your input

| Blocker | What I need from you |
|---|---|
| Phase 2 database | Provision Neon Postgres in Vercel Marketplace (one click). |
| Phase 5 auth | Provision Clerk in Vercel Marketplace. |
| Phase 5 email | Provision Resend in Vercel Marketplace. |
| Phase 7 GitHub | Create empty `hantawatch` repo on github.com/&lt;your-account&gt;. |
| Phase 8 forecasting | Pick: pure-TS lib (simple) vs. Python service (better). |

Everything else I can ship myself once you green-light scope.
