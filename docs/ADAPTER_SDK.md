# HantaWatch Adapter SDK

This document describes the contract for adding a new live-data source to
HantaWatch. The whole point of this codebase is to be permeable to new
sources — most fixes happen here.

## The shape

An adapter is **one TypeScript file** under `lib/sources/`. It exports an
async fetcher and a typed result. That's it.

### Minimum result shape

```ts
export interface AdapterResult<T> {
  /** True if the upstream fetch succeeded and returned the expected data. */
  ok: boolean;
  /** ISO timestamp of the moment we hit the upstream. */
  fetchedAt: string;
  /** Human-readable name shown on /sources and /methodology. */
  source: string;
  /** Public URL that lets a user verify your adapter against the publisher. */
  sourceUrl: string;
  /** The actual data — shape is up to you. */
  data: T;
}
```

### Minimum fetcher shape

```ts
export async function fetchYourSource(): Promise<AdapterResult<MyShape>> {
  const fetchedAt = new Date().toISOString();
  try {
    const r = await fetch(UPSTREAM_URL, {
      headers: { "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      // Cache 6h at the edge unless your upstream changes more slowly.
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return empty(false, fetchedAt);
    // ... parse + return
    return { ok: true, fetchedAt, source: "...", sourceUrl: "...", data: parsed };
  } catch {
    return empty(false, fetchedAt);
  }
}

function empty(ok: boolean, fetchedAt: string): AdapterResult<MyShape> {
  return { ok, fetchedAt, source: "...", sourceUrl: "...", data: emptyShape };
}
```

## Hard rules

1. **No fake data.** If the upstream is empty or returns garbage, return
   `ok: false`. Don't fill in zeros, defaults, or imputed values. Existing
   adapters use `null` to mean "the source did not publish this" and `0`
   only when the source explicitly published zero.
2. **Cache at the edge.** Always `next: { revalidate }`. 6h (`21600`) is
   the default. Bump higher (`86400` for 24h) for reference data that moves
   slowly. Never lower than 60s without a strong reason.
3. **Time out.** Use `AbortSignal.timeout(10_000)` (or shorter). The cron
   route runs all adapters in parallel; one slow upstream should not stall
   the whole live fetch.
4. **Fail open.** Wrap your network call in try/catch and return
   `ok: false` on any error. The UI degrades gracefully — your adapter's
   absence shouldn't break the dashboard.
5. **Fair-use aggregation only.** For news / RSS sources, display titles +
   source attribution + link to the original. **Do not reproduce article
   bodies.** Look at `lib/sources/agency-rss.ts` for the canonical pattern.
6. **Cite the source URL.** The `sourceUrl` field is shown on `/sources`
   and `/methodology` so users can verify directly.
7. **CSP.** If your adapter uses a new host, add it to
   `next.config.ts` → `connect-src`. Same for `img-src` if your upstream
   serves images we render.

## Wiring the adapter into the app

Once your fetcher is written:

1. **Add it to `lib/sources/index.ts:fetchLive()`** if it produces
   surveillance signals (countries / events). Push a row into the `sources`
   array so it appears on `/sources` and `/api/health/sources`.
2. **Or add it to `lib/sources/research.ts:fetchResearch()`** if it
   produces research signals (publications / preprints / pageviews / similar).
3. **Update `app/sources/page.tsx:ACTIVE`** with a card describing what
   your adapter contributes — region, refresh cadence, parsing approach.
4. **Update `app/methodology/page.tsx:ADAPTER_DOCS`** with the same. The
   methodology page surfaces the explicit per-adapter contract publicly.

## Testing your adapter

There's no automated test runner yet (Tier B item). For now:

```bash
# Probe upstream live to make sure it returns what you expect:
node -e 'fetch("YOUR_URL").then(r=>r.text()).then(t=>console.log(t.slice(0,1500)))'

# Run a one-off adapter call:
npm run dev
# then visit http://localhost:3000/api/health/sources to confirm your
# adapter shows up with ok:true.

# Build will type-check the whole pipeline:
npm run build
```

## Quality bar

PRs that pass on the first review usually:

- have a single-purpose adapter file (~50–150 LOC)
- show their parser handling 0/1/many rows
- have a clear `sourceUrl` pointing at the publisher's stable index page
- gracefully fail when upstream is down (try/catch + `ok: false`)
- match the existing TypeScript strictness (no `any`, no `as` casts to
  silence type errors — narrow properly)

## Examples to read

In rough order of complexity:

1. **`lib/sources/cdc.ts`** — simplest: HTML scrape with regex for one
   sentence. ~50 LOC.
2. **`lib/sources/wikipedia.ts`** — JSON REST per-slug fetcher with a
   shared call helper. ~50 LOC.
3. **`lib/sources/agency-rss.ts`** — multi-source RSS adapter with a
   single shared parser. CDC MMWR + PAHO live in this file. ~100 LOC.
4. **`lib/sources/who.ts`** — most complex: OData JSON fetch + multi-stage
   text parsing for case breakdown extraction. ~200 LOC.
5. **`lib/sources/nndss.ts`** — SODA JSON with two queries (US-wide + per-
   state) merged. ~150 LOC.

If you can write something like the first two, you can ship an adapter.
