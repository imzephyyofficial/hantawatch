# Contributing to HantaWatch

Thanks for showing up. HantaWatch is an open hantavirus-surveillance dashboard
that aggregates **only** primary-source data (WHO, CDC, ECDC, PAHO, EuropePMC,
GBIF, Wikipedia) into one verifiable view. The fastest way to make it more
useful is to add a new live source adapter.

This guide covers:

1. [Repo layout](#repo-layout)
2. [Local setup](#local-setup)
3. [Adding a data source](#adding-a-data-source) — the most-wanted contribution
4. [Submitting a pull request](#submitting-a-pull-request)
5. [Coding conventions](#coding-conventions)
6. [Where to ask questions](#where-to-ask-questions)

---

## Repo layout

```
app/                  Next.js App Router pages + API routes
  api/v1/             public read-only data API (CORS-open)
  api/health/         source freshness check
  api/admin/          gated admin endpoints (migrate, etc.)
components/           shared React components (ui/, charts/, maps/, layout/)
lib/
  sources/            ⭐  one TS file per upstream source — this is where you add things
  db/                 Drizzle schema + queries (Neon Postgres)
  data.ts             static reference data with citations (strains, sources)
  metrics.ts          pure metric helpers (totalCases, overallCfr, etc.)
  format.ts           date / number / CFR formatting (null-safe)
  geo.ts              country + US state centroids for map markers
docs/                 ROADMAP, ADAPTER_SDK
```

---

## Local setup

```bash
git clone https://github.com/imzephyyofficial/hantawatch.git
cd hantawatch
npm install
npm run dev          # http://localhost:3000
```

Most pages render against live upstream sources directly — no `DATABASE_URL`
needed for the read path. Account features (subscriptions / API keys) need
the Vercel-Native Neon integration to be live; locally, sign in to Vercel
and run:

```bash
vercel link                    # link to the hantawatch-global project
vercel env pull .env.local     # pulls non-sensitive env vars
```

Build:

```bash
npm run build
npm run type-check
```

Deploy:

```bash
vercel --prod
```

---

## Adding a data source

**This is the highest-impact contribution.** Every adapter expands the live
surface area, lets us cover a region we don't yet, or backfills a gap.

The full contract is in [`docs/ADAPTER_SDK.md`](./docs/ADAPTER_SDK.md). The
tl;dr:

1. Add a single TypeScript file under `lib/sources/<your-source>.ts`.
2. Export an async fetcher returning a typed result with at minimum
   `ok`, `fetchedAt`, `source`, `sourceUrl`. Use `next: { revalidate: 21600 }`
   on the underlying `fetch` so we cache 6h at the edge.
3. Wire it into `lib/sources/index.ts` (`fetchLive`) so its rows appear in
   the source-health endpoint and dashboard.
4. **Cite the source.** Each adapter must include the public URL its data
   came from in its `sourceUrl`. We don't store or display upstream content
   beyond what's necessary for fair-use aggregation (titles + attribution +
   link-back to the original). No body-text reproduction.
5. Fail open. If the upstream returns 4xx/5xx or times out, return `ok: false`
   and an empty payload. The UI gracefully degrades.

Open an issue first if you're not sure whether a source belongs (license
clarity is the main filter).

### Sources we already have ✅

WHO DON · CDC cumulative · CDC NNDSS Weekly · CDC MMWR · PAHO RSS · EuropePMC ·
bioRxiv/medRxiv · Wikipedia REST · Wikipedia pageviews · GBIF.

### Sources we'd love help on 🙏

| Source | Status | Notes |
|---|---|---|
| **ECDC Annual Epidemiological Report** | not started | Hantavirus AERs are PDF-only — needs a `pdf-parse` step. |
| **Brazil Ministério da Saúde / SINAN** | not started | Public PDF + spreadsheet bulletins. PT-BR localization opportunity. |
| **Argentina Boletín Epidemiológico Nacional** | not started | Weekly PDF. ES localization opportunity. |
| **Robert Koch Institute (Germany)** | URL-stale | Site moved; need to re-discover the SurvStat API or scrape the new hantavirus stats page. |
| **THL Finland (Tartuntataudit)** | URL-stale | Same — needs re-discovery. |
| **Folkhälsomyndigheten (Sweden)** | URL-stale | Same. |
| **Korea KDCA** | endpoint timed out | Need to find an alternate ingress. |
| **GISAID hantavirus genomics** | not started | Auth-gated; could surface counts only. |
| **NCBI Virus** | partial | Genomic data exists in their API; not yet surfaced. |
| **ProMED-mail** | gated | ISID requires API access; we'd add it under a paid path. |
| **HealthMap** | paid | Same. |

If you maintain or can access any of these, or know of a national-agency
hantavirus dataset we don't list, open an issue.

---

## Submitting a pull request

1. Fork → branch `feat/source-<name>` or `fix/<area>-<short>`.
2. Make sure `npm run build` and `npm run type-check` both pass.
3. Add or update an entry in `docs/ROADMAP.md` if your change moves the
   phase status.
4. Open a PR. Describe:
   - what data is now covered
   - the public URL the adapter points at
   - whether it requires a new env var
   - any caveats (rate limits, sparse coverage, etc.)
5. CI runs typecheck + build. Once green and reviewed, we'll merge.

We squash-merge so your final PR description becomes the commit message.

---

## Coding conventions

- **TypeScript strict mode.** No `any` unless you're calling untyped third-party APIs and immediately narrowing.
- **No fake or imputed data.** When a source doesn't publish a value, return `null`. Coercing to zero is forbidden — see `lib/format.ts:cfr` for the canonical example.
- **One adapter, one file.** Don't merge sources together unless they share a parser implementation (`agency-rss.ts` is the only example: CDC MMWR + PAHO both use the same RSS shape).
- **Tailwind v4** (CSS-first). New components match the existing dark theme and follow the BigCounter / Card / Badge primitives in `components/ui/`.
- **Lazy-load heavy charts** with `next/dynamic` so they don't ship in the initial bundle of every page.
- **Cache 6h** at the edge for live-data fetches; **24h** for reference data (Wikipedia, GBIF).
- **CSP-friendly.** New external hosts must be added to `next.config.ts` `connect-src` / `img-src` as appropriate.
- **A11y.** Buttons need `aria-label` for icon-only variants. Color contrast WCAG AA. Respect `prefers-reduced-motion`.

---

## Where to ask questions

- **GitHub issues** — bug reports, source proposals, feature requests
- **GitHub discussions** — open-ended questions

By contributing you agree your contribution is licensed under MIT (the
project license) and that any data you point us to is redistributable
under the linked source's terms.
