import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { strains, dataSources } from "@/lib/data";
import { fetchLive } from "@/lib/sources";
import { fetchResearch } from "@/lib/sources/research";
import { ExternalLink, ShieldCheck, AlertCircle, Database } from "lucide-react";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How HantaWatch sources every number. Live adapters, static reference citations, refresh cadence, and our null-safety policy.",
};

export const revalidate = 21600;

export default async function Page() {
  const [live, research] = await Promise.all([fetchLive(), fetchResearch()]);

  return (
    <>
      <Topbar
        title="Methodology"
        subtitle="How every number on HantaWatch traces back to a real source"
        relativeFetch={live.fetchedAt}
      />

      <Card className="mb-8 border-l-[3px] border-l-emerald-500">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--color-fg-secondary)] leading-relaxed">
            <strong>Our promise:</strong> we never invent or impute counts.
            Every number on the dashboard either comes from a live source
            adapter (verifiable at <Link href="/api/health/sources" className="text-blue-400 hover:text-blue-300">/api/health/sources</Link>)
            or is a cited reference fact (virology, geographic, taxonomic).
            When a source doesn&rsquo;t publish a value we show <code className="text-xs px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)]">—</code>{" "}
            and explain why. CFR is computed only when both case and death
            counts are present; otherwise null.
          </div>
        </div>
      </Card>

      <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-blue-400" /> Live source adapters
      </h2>
      <p className="text-sm text-[var(--color-fg-muted)] mb-4">
        Every adapter below is fetched on each page render via Next.js
        edge cache (6h revalidate). Each lives in <code className="text-xs px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)]">lib/sources/</code> as
        a single TypeScript file with a clear contract — see <Link href="https://github.com/imzephyyofficial/hantawatch/blob/main/lib/sources" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">github.com/imzephyyofficial/hantawatch</Link>.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        {ADAPTER_DOCS.map((d) => (
          <Card key={d.name}>
            <CardHeader>
              <div>
                <CardTitle>{d.name}</CardTitle>
                <CardSubtitle>{d.kind} · refreshed every {d.cadence}</CardSubtitle>
              </div>
              <Badge variant="success">live</Badge>
            </CardHeader>
            <p className="text-sm text-[var(--color-fg-secondary)] mb-3">{d.contributes}</p>
            <dl className="text-xs space-y-1.5">
              <Row label="Source URL" value={
                <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                  {d.sourceUrl} <ExternalLink className="inline h-3 w-3" />
                </a>
              } />
              <Row label="API endpoint" value={<span className="font-mono text-[10px] break-all">{d.apiPattern}</span>} />
              <Row label="Parsing" value={d.parsing} />
              {d.notes && <Row label="Notes" value={d.notes} />}
            </dl>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-purple-400" /> Strain reference citations
      </h2>
      <p className="text-sm text-[var(--color-fg-muted)] mb-4">
        Strain pages display virology facts (reservoir species, syndrome,
        CFR range, geographic range). These don&rsquo;t change with daily
        surveillance — they&rsquo;re drawn from primary literature and
        agency factsheets. Each claim cites its source below.
      </p>

      <div className="space-y-3 mb-10">
        {strains.map((s) => (
          <Card key={s.name}>
            <CardHeader>
              <div>
                <CardTitle>{s.name} virus</CardTitle>
                <CardSubtitle>{s.family} · {s.syndrome} · CFR {s.cfrRange[0]}–{s.cfrRange[1]}%</CardSubtitle>
              </div>
              <Link href={`/strain/${s.name.toLowerCase().replace(/\s+/g, "-")}`} className="text-xs text-blue-400 hover:text-blue-300">
                Strain page →
              </Link>
            </CardHeader>
            <ul className="text-xs space-y-2">
              {s.citations.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--color-fg-muted)] font-mono w-4 flex-shrink-0">[{i + 1}]</span>
                  <div className="min-w-0">
                    <div className="text-[var(--color-fg-secondary)]">{c.claim}</div>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all text-[11px]">
                      {c.source} ↗
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-400" /> Static reference data — what doesn&rsquo;t come from a live API
      </h2>
      <Card className="mb-6">
        <ul className="text-sm space-y-3 text-[var(--color-fg-secondary)]">
          <li>
            <strong>Country populations</strong> — used to compute per-million
            metrics on country pages. Source: UN Department of Economic and
            Social Affairs &mdash;{" "}
            <a href="https://population.un.org/wpp/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              World Population Prospects ↗
            </a>. Latest snapshot used.
          </li>
          <li>
            <strong>Country centroids</strong> — used to place map markers.
            Source: Wikipedia geographic centers / Natural Earth admin
            centroids. Approximate single-point per region. Suitable for
            marker placement, not for boundary rendering.
          </li>
          <li>
            <strong>US state centroids</strong> — used to place NNDSS state
            markers. Source: US Census Bureau geographic centers (2020).
          </li>
          <li>
            <strong>Cruise event waypoints</strong> — every waypoint on the
            MV Hondius route map cites the relevant section of WHO DON 600
            Overview directly in <code className="text-xs px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)]">lib/event-routes.ts</code>{" "}
            and is shown on{" "}
            <Link href="/outbreaks/who-2026-DON600" className="text-blue-400 hover:text-blue-300">
              the outbreak page
            </Link>.
          </li>
        </ul>
      </Card>

      <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-400" /> Null-safety policy
      </h2>
      <Card className="mb-6">
        <ul className="text-sm space-y-2 text-[var(--color-fg-secondary)] leading-relaxed">
          <li>• <strong>CFR</strong> renders as <code>—</code> unless both cases <em>and</em> deaths are explicitly published. We never coerce missing deaths to zero.</li>
          <li>• <strong>Per-country case counts</strong> stay as <code>—</code> when WHO doesn&rsquo;t break down a multi-country event by country. The UI explains this with a callout above the surveillance table.</li>
          <li>• <strong>Highest-CFR statistic</strong> falls back to the most recent WHO event&rsquo;s computed CFR if no individual country has both numbers, with a label clarifying which event the figure is from.</li>
          <li>• <strong>Map markers</strong> are placed only at known centroids. If a source mentions a region we don&rsquo;t have coordinates for, the row appears in the table but no marker is drawn — by design, never an arbitrary placement.</li>
          <li>• <strong>Source freshness</strong> is exposed publicly at{" "}
            <Link href="/api/health/sources" className="text-blue-400 hover:text-blue-300">/api/health/sources</Link>. If an adapter fails, its detail field reads &ldquo;fetch failed&rdquo; and downstream UI degrades gracefully.</li>
        </ul>
      </Card>

      <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
        Cross-check links
      </h2>
      <Card>
        <p className="text-sm text-[var(--color-fg-secondary)] mb-3">
          Every number on this site can be verified against the publishers below. If you spot a discrepancy, please open an issue.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {dataSources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {s.name} ↗
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-[var(--color-border-soft)] text-xs text-[var(--color-fg-muted)]">
          {live.sources.filter((s) => s.ok).length}/{live.sources.length} surveillance + {[research.publications, research.preprints, research.pageviews].filter((r) => r.ok).length}/3 research sources are live as of last fetch.
        </div>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <dt className="text-[var(--color-fg-muted)] uppercase tracking-wider text-[10px] font-semibold pt-0.5">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const ADAPTER_DOCS: Array<{
  name: string;
  kind: string;
  cadence: string;
  contributes: string;
  sourceUrl: string;
  apiPattern: string;
  parsing: string;
  notes?: string;
}> = [
  {
    name: "WHO Disease Outbreak News",
    kind: "Surveillance · multi-country",
    cadence: "6 hours",
    contributes: "Active outbreak events, country involvement, total cases / confirmed / probable / hospitalized / critical / deceased / recovered counts parsed from each DON's published Summary text.",
    sourceUrl: "https://www.who.int/emergencies/disease-outbreak-news",
    apiPattern: "https://www.who.int/api/news/diseaseoutbreaknews?$filter=contains(Title,'antavirus')",
    parsing: "OData JSON. We filter pre-2020 archive republications by URL slug + title year + publication date. Counts extracted from prose with regex patterns ('total of X cases, including Y deaths', 'Z laboratory-confirmed', etc.).",
    notes: "Only post-2020 entries are surfaced.",
  },
  {
    name: "CDC Hantavirus — cumulative US cases",
    kind: "Surveillance · United States",
    cadence: "6 hours",
    contributes: "All-time US cumulative cases since surveillance began in 1993, plus the as-of year. Surfaces on the US country page as historical context.",
    sourceUrl: "https://www.cdc.gov/hantavirus/data-research/cases/index.html",
    apiPattern: "HTML page · regex match on \"end of YYYY, NNN cases\"",
    parsing: "We strip script/style tags, then look for the canonical sentence pattern CDC uses to publish the cumulative count.",
  },
  {
    name: "CDC NNDSS Weekly Tables",
    kind: "Surveillance · United States",
    cadence: "6 hours",
    contributes: "US weekly counts for 'Hantavirus pulmonary syndrome' and 'Hantavirus infection, non-hantavirus pulmonary syndrome', plus a state-by-state breakdown for the current reporting year.",
    sourceUrl: "https://data.cdc.gov/Public-Health-Surveillance/Reportable-/x9gk-5huc",
    apiPattern: "https://data.cdc.gov/resource/x9gk-5huc.json (SODA)",
    parsing: "Filter rows where label matches /HANTAVIRUS/i. Extract the 'cumulative YTD' column (m4) per row. State breakdown filters out census regions and aggregates.",
  },
  {
    name: "CDC MMWR",
    kind: "Surveillance · publications",
    cadence: "6 hours",
    contributes: "Morbidity and Mortality Weekly Report items whose titles match a hantavirus pattern. Used in the signals feed; we display title + date + link only.",
    sourceUrl: "https://www.cdc.gov/mmwr/",
    apiPattern: "https://www.cdc.gov/mmwr/rss/mmwr.xml",
    parsing: "RSS 2.0 with regex item splitter. Filter on /hantavirus|HCPS|HFRS|Sin Nombre|Andes|Puumala|Hantaan/i title match.",
    notes: "Public-domain US government content; no body-text reproduction.",
  },
  {
    name: "PAHO / WHO Americas",
    kind: "Surveillance · regional",
    cadence: "6 hours",
    contributes: "PAHO main RSS items with a hantavirus title match. Surfaces regional response and updates beyond what WHO DON publishes.",
    sourceUrl: "https://www.paho.org/en/topics/hantavirus",
    apiPattern: "https://www.paho.org/en/rss.xml",
    parsing: "RSS 2.0 with same hantavirus regex.",
  },
  {
    name: "EuropePMC",
    kind: "Research · publications",
    cadence: "6 hours",
    contributes: "Total indexed papers about hantavirus across the literature, plus the 10 most recent publications with author / journal / year metadata.",
    sourceUrl: "https://europepmc.org/search?query=hantavirus",
    apiPattern: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=hantavirus",
    parsing: "JSON. We use hitCount for total + resultList.result for recent.",
  },
  {
    name: "bioRxiv / medRxiv",
    kind: "Research · preprints",
    cadence: "6 hours",
    contributes: "Recent preprints filtered for hantavirus mentions in title or abstract over a 90-day rolling window.",
    sourceUrl: "https://www.biorxiv.org/search/hantavirus",
    apiPattern: "https://api.biorxiv.org/details/{server}/{since}/{until}/{cursor}",
    parsing: "JSON details API, client-side regex filter for hantavirus / strain mentions.",
    notes: "Preprint volume for endemic diseases is sparse; expect 0–5 hits over 90 days.",
  },
  {
    name: "Wikipedia REST",
    kind: "Reference",
    cadence: "24 hours",
    contributes: "Strain encyclopedia summary on each strain page, sourced from the canonical Wikipedia article for that virus.",
    sourceUrl: "https://en.wikipedia.org/wiki/Orthohantavirus",
    apiPattern: "https://en.wikipedia.org/api/rest_v1/page/summary/{slug}",
    parsing: "JSON; we display the extract + link to the article.",
  },
  {
    name: "Wikipedia pageviews",
    kind: "Research · public attention",
    cadence: "6 hours",
    contributes: "Daily pageview counts for the canonical hantavirus articles in English Wikipedia (Orthohantavirus, HPS, HFRS) over a 60-day window. Used as a proxy for public-attention spikes.",
    sourceUrl: "https://pageviews.wmcloud.org/",
    apiPattern: "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/...",
    parsing: "JSON; aggregate across articles per day.",
  },
  {
    name: "GBIF",
    kind: "Reference · taxonomy",
    cadence: "24 hours",
    contributes: "Reservoir-species taxonomy on each strain page (kingdom, phylum, order, family, genus) plus total recorded occurrences worldwide as a range proxy.",
    sourceUrl: "https://www.gbif.org/",
    apiPattern: "https://api.gbif.org/v1/species/match · /v1/occurrence/search",
    parsing: "JSON; species match on the reservoir's scientific name, then occurrence count for that taxonKey.",
  },
];
