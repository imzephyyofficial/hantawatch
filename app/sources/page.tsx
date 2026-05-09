import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLive } from "@/lib/sources";
import { fmtDate } from "@/lib/format";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Data sources",
  description: "Every public source HantaWatch reads from, with last-fetch state and what each contributes.",
};

export const revalidate = 21600;

const ACTIVE = [
  {
    name: "WHO Disease Outbreak News",
    url: "https://www.who.int/emergencies/disease-outbreak-news",
    api: "https://www.who.int/api/news/diseaseoutbreaknews",
    contributes: "Outbreak events, country involvement, total cases/deaths/CFR parsed from event Summary",
    region: "Global",
    type: "JSON · OData",
  },
  {
    name: "CDC Hantavirus — cumulative US cases",
    url: "https://www.cdc.gov/hantavirus/data-research/cases/index.html",
    api: "HTML scrape · cumulative count + as-of year",
    contributes: "All-time US cumulative since 1993",
    region: "United States",
    type: "HTML",
  },
  {
    name: "CDC NNDSS Weekly Tables",
    url: "https://data.cdc.gov/Public-Health-Surveillance/Reportable-/x9gk-5huc",
    api: "https://data.cdc.gov/resource/x9gk-5huc.json",
    contributes: "US weekly counts for HPS + non-HPS infection · per-state breakdown · 12-week history",
    region: "United States",
    type: "JSON · SODA",
  },
  {
    name: "Wikipedia REST API",
    url: "https://en.wikipedia.org/wiki/Orthohantavirus",
    api: "https://en.wikipedia.org/api/rest_v1/page/summary/{slug}",
    contributes: "Strain reference content, syndrome background",
    region: "Reference",
    type: "JSON",
  },
];

const PLANNED: Array<{ name: string; reason: string; url?: string }> = [
  { name: "ECDC Annual Epidemiological Reports", reason: "Hantavirus AER published as PDF; needs PDF text extraction.", url: "https://www.ecdc.europa.eu/en/hantavirus-infection" },
  { name: "PAHO Epidemiological Updates", reason: "Pages are HTML behind anti-bot — needs careful scraping with retry logic.", url: "https://www.paho.org/en/topics/hantavirus" },
  { name: "Robert Koch Institute (Germany)", reason: "URLs returned 404 — RKI restructured site; need to re-discover hantavirus stats endpoint.", url: "https://survstat.rki.de/" },
  { name: "THL Finland", reason: "Tartuntataudit register requires re-discovering current URL after THL site redesign.", url: "https://thl.fi/en/" },
  { name: "Folkhälsomyndigheten (Sweden)", reason: "Hantavirus stats page URL changed after FHM redesign.", url: "https://www.folkhalsomyndigheten.se/" },
  { name: "Korea Disease Control & Prevention Agency", reason: "Public stats endpoint timed out — likely needs different approach.", url: "https://www.kdca.go.kr/" },
  { name: "Argentina Boletín Epidemiológico Nacional", reason: "Published as weekly PDF — needs PDF parsing pipeline.", url: "https://www.argentina.gob.ar/salud/epidemiologia/boletines-epidemiologicos" },
  { name: "ProMED-mail", reason: "Public RSS/feed paths return 404 — ISID requires API access for programmatic reads.", url: "https://promedmail.org/" },
];

export default async function Page() {
  const { sources, fetchedAt } = await fetchLive();

  return (
    <>
      <Topbar
        title="Data sources"
        subtitle="What feeds HantaWatch, and how fresh each source is right now"
        snapshotDate={fetchedAt.slice(0, 10)}
      />

      <Card className="mb-6">
        <p className="text-sm text-[var(--color-fg-secondary)]">
          Every number on this site comes from one of the active sources below.
          When a source can&rsquo;t supply a value, the dashboard shows
          &ldquo;—&rdquo; with an explanation. We never invent numbers and we
          don&rsquo;t cache them longer than 6 hours at the edge.
        </p>
      </Card>

      <h2 className="text-lg font-bold tracking-tight mb-4">Active sources ({sources.length})</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        {sources.map((s) => {
          const meta = ACTIVE.find((m) => m.name === s.source);
          return (
            <Card key={s.source}>
              <CardHeader>
                <div>
                  <CardTitle>{s.source}</CardTitle>
                  <CardSubtitle>{meta?.region ?? "—"} · {meta?.type ?? "—"}</CardSubtitle>
                </div>
                <Badge variant={s.ok ? "success" : "warn"}>
                  {s.ok ? "Operational" : "Degraded"}
                </Badge>
              </CardHeader>
              <p className="text-sm text-[var(--color-fg-secondary)] mb-3">
                {meta?.contributes ?? "—"}
              </p>
              <dl className="grid grid-cols-1 gap-y-2 text-xs">
                <KV label="Last fetch" value={new Date(s.fetchedAt).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" })} />
                <KV label="Detail" value={s.detail ?? "—"} />
                <KV label="Source" value={
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                    {s.url} <ExternalLink className="inline h-3 w-3" />
                  </a>
                } />
                {meta?.api && (
                  <KV label="API" value={
                    <span className="font-mono text-[11px] text-[var(--color-fg-muted)] break-all">{meta.api}</span>
                  } />
                )}
              </dl>
            </Card>
          );
        })}
      </div>

      <h2 className="text-lg font-bold tracking-tight mb-4">Planned · {PLANNED.length} sources</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLANNED.map((p) => (
          <Card key={p.name}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-sm">{p.name}</h3>
              <Badge>Planned</Badge>
            </div>
            <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{p.reason}</p>
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block break-all">
                {p.url} <ExternalLink className="inline h-3 w-3" />
              </a>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h3 className="font-semibold mb-2">Help us cover more</h3>
        <p className="text-sm text-[var(--color-fg-secondary)]">
          If you maintain a national surveillance dataset (or know of a public
          API we should be reading), open an issue or send a PR with the
          adapter. The contract is one TypeScript file under{" "}
          <code className="font-mono text-xs bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">lib/sources/&lt;name&gt;.ts</code>{" "}
          that exports a fetcher returning records / events with attribution.
        </p>
      </Card>
    </>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <dt className="text-[var(--color-fg-muted)] uppercase tracking-wider text-[10px] font-semibold pt-0.5">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
