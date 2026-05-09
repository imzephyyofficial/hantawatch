import dynamic from "next/dynamic";
import Link from "next/link";
import { Radio, ExternalLink, AlertCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { BigCounter } from "@/components/cards/big-counter";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StrainDisplay } from "@/components/charts/strain-display";
import { SourceBreakdownTable } from "@/components/source-breakdown-table";
import { RelativeTime } from "@/components/relative-time";
import { AlertFeed } from "@/components/alert-feed";
import { dataSources } from "@/lib/data";
import { fetchLive } from "@/lib/sources";
import {
  outbreakRows,
  snapshotDate,
  strainAggregates,
} from "@/lib/metrics";
import { fmt, fmtCfr, fmtDate } from "@/lib/format";

// Heavy charts code-split — they're "use client" internally so this just defers their JS
const UsWeeklyChart = dynamic(() => import("@/components/charts/us-weekly-chart").then((m) => m.UsWeeklyChart), {
  loading: () => <div className="h-[260px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading chart…</div>,
});
const WorldMap = dynamic(() => import("@/components/maps/world-map").then((m) => m.WorldMap), {
  loading: () => <div className="h-[480px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading world map…</div>,
});

export const revalidate = 21600;

export default async function DashboardPage() {
  const live = await fetchLive();
  const { countries, events, sources, totals, breakdownRows, usWeekly } = live;

  const ob = outbreakRows(countries);
  const strains = strainAggregates(countries);
  const latestEvent = events[0];

  // Highest CFR — derived from the most recent WHO event when country-level CFR isn't computable.
  const eventCfr = latestEvent?.breakdown
    && latestEvent.breakdown.deceased != null
    && latestEvent.breakdown.reported != null
    && latestEvent.breakdown.reported > 0
    ? (latestEvent.breakdown.deceased / latestEvent.breakdown.reported) * 100
    : null;

  return (
    <>
      <Topbar
        title="Global Surveillance"
        subtitle="Live hantavirus tracking · WHO Disease Outbreak News · CDC NNDSS · Wikipedia reference"
        snapshotDate={snapshotDate(countries)}
        relativeFetch={live.fetchedAt}
      />

      {/* JHU CSSE-style hero */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <BigCounter
          label="Reported"
          value={totals.reported != null ? fmt(totals.reported) : "—"}
          sub="Total cases reported"
          accent="danger"
        />
        <BigCounter
          label="Confirmed"
          value={totals.confirmed != null ? fmt(totals.confirmed) : "—"}
          sub="Lab-confirmed"
          accent="warn"
        />
        <BigCounter
          label="Probable"
          value={totals.probable != null ? fmt(totals.probable) : "—"}
          sub="Suspected / probable"
          accent="amber"
        />
        <BigCounter
          label="Hospitalized"
          value={totals.hospitalized != null ? fmt(totals.hospitalized) : "—"}
          sub={totals.critical != null ? `${totals.critical} in critical care` : "—"}
          accent="cyan"
        />
        <BigCounter
          label="Deceased"
          value={totals.deceased != null ? fmt(totals.deceased) : "—"}
          sub={eventCfr != null ? `CFR ${fmtCfr(eventCfr)} (current event)` : "—"}
          accent="purple"
        />
        <BigCounter
          label="Recovered"
          value={totals.recovered != null ? fmt(totals.recovered) : "—"}
          sub="Discharged"
          accent="success"
        />
      </div>

      {/* Source provenance — fix accuracy bug 1: where does each number come from */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Where these numbers come from</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Per-source contributions. We do not invent or impute counts.
            </p>
          </div>
          <Link href="/sources" className="text-sm font-medium text-blue-400 hover:text-blue-300">
            All sources →
          </Link>
        </div>
        <SourceBreakdownTable rows={breakdownRows} totals={totals} />
      </section>

      {/* Coverage strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 text-sm">
        <CoverageStat label="Countries flagged" value={countries.length} />
        <CoverageStat label="Active WHO alerts" value={events.length} />
        <CoverageStat label="Outbreak status" value={ob.length} />
        <CoverageStat label="Live sources" value={`${sources.filter((s) => s.ok).length} / ${sources.length}`} />
      </div>

      {/* Active outbreak callout */}
      {latestEvent && (
        <Card className="mb-8 border-l-[3px] border-l-red-500">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base font-bold">{latestEvent.title}</h3>
                <Badge variant="outbreak">{latestEvent.severity}</Badge>
              </div>
              <p className="text-sm text-[var(--color-fg-secondary)] leading-relaxed">{latestEvent.body}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-fg-muted)]">
                <span>Source: <a href={latestEvent.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{latestEvent.source}</a></span>
                <span>Published {fmtDate(latestEvent.date)}</span>
                <Link href={`/outbreaks/${latestEvent.id}`} className="text-blue-400 hover:text-blue-300 font-medium">Full event →</Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Live activity map</CardTitle>
            <CardSubtitle>
              {countries.length === 0
                ? "Awaiting WHO + CDC data — no countries currently flagged"
                : `${countries.length} countr${countries.length === 1 ? "y" : "ies"} flagged · hover for detail · click to drill in`}
            </CardSubtitle>
          </div>
        </CardHeader>
        <WorldMap data={countries} />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        {/* Replaced EventFrequencyChart with the actually-useful NNDSS US weekly chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>US weekly trend (NNDSS)</CardTitle>
              <CardSubtitle>
                {usWeekly.ok
                  ? `Last ${usWeekly.weeklyHistory.length} reporting weeks · YTD ${usWeekly.reportingYear} through week ${usWeekly.reportingWeek}`
                  : "Awaiting CDC NNDSS data"}
              </CardSubtitle>
            </div>
            <a href={usWeekly.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-muted)] hover:text-blue-400">
              CDC source <ExternalLink className="inline h-3 w-3" />
            </a>
          </CardHeader>
          {usWeekly.ok && usWeekly.weeklyHistory.length > 0 ? (
            <UsWeeklyChart data={usWeekly.weeklyHistory} />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">No NNDSS data this period.</div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>By strain</CardTitle>
              <CardSubtitle>Live reporting set</CardSubtitle>
            </div>
          </CardHeader>
          <StrainDisplay data={strains} />
        </Card>
      </div>

      <section className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Regional reporting</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Aggregated from countries currently in the live set</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(["Americas", "Europe", "Asia"] as const).map((region) => {
            const rows = countries.filter((c) => c.region === region);
            const total = rows.reduce((s, r) => s + (r.cases ?? 0), 0);
            return (
              <Card key={region}>
                <CardHeader>
                  <div>
                    <CardTitle>{region}</CardTitle>
                    <CardSubtitle>
                      {rows.length} reporting countr{rows.length === 1 ? "y" : "ies"}
                    </CardSubtitle>
                  </div>
                  <div className="font-mono text-base font-bold">{total > 0 ? fmt(total) : "—"}</div>
                </CardHeader>
                {rows.length === 0 ? (
                  <p className="text-sm text-[var(--color-fg-muted)] py-4">No live data this region.</p>
                ) : (
                  rows.slice(0, 5).map((r) => (
                    <Link
                      key={r.iso}
                      href={`/country/${r.iso}`}
                      className="flex items-center justify-between py-3 border-b border-[var(--color-border-soft)] last:border-b-0 hover:opacity-80"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-base flex-shrink-0">
                          {r.flag}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{r.country}</div>
                          <div className="text-xs text-[var(--color-fg-muted)] truncate">{r.strain ?? "Strain TBD"}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-semibold text-[var(--color-fg-secondary)]">
                        {r.cases != null ? fmt(r.cases) : "—"}
                      </div>
                    </Link>
                  ))
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {events.length > 0 && (
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400" /> WHO Disease Outbreak News
                </h2>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Live · <RelativeTime iso={live.fetchedAt} prefix="updated" /> · {events.length} entr{events.length === 1 ? "y" : "ies"}
                </p>
              </div>
              <Badge variant="success" pulse>live</Badge>
            </div>
            <a href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              WHO source <ExternalLink className="inline h-3 w-3" />
            </a>
          </div>
          <AlertFeed events={events.slice(0, 6)} />
        </section>
      )}

      <Footer sources={sources} />
    </>
  );
}

function CoverageStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 backdrop-blur-md">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-fg-muted)]">{label}</div>
      <div className="text-2xl font-bold font-mono tabular-nums mt-1">{value}</div>
    </div>
  );
}

function Footer({ sources }: { sources: Array<{ source: string; ok: boolean; detail?: string }> }) {
  return (
    <footer className="mt-12 pt-6 border-t border-[var(--color-border-soft)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-[var(--color-fg-muted)]">
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Live sources</h4>
        {sources.map((s) => (
          <div key={s.source} className="py-0.5 flex items-start gap-2">
            <span className={s.ok ? "text-emerald-400" : "text-amber-400"}>●</span>
            <span className="leading-tight">
              <span className="font-medium">{s.source}</span>
              <br />
              <span className="text-[var(--color-fg-muted)]">{s.detail}</span>
            </span>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Source documents</h4>
        {dataSources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="block py-0.5 hover:text-blue-400">
            {s.name} ↗
          </a>
        ))}
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Methodology</h4>
        <p>Counters add the most-recent WHO Disease Outbreak News breakdown to NNDSS YTD US counts. CDC&rsquo;s cumulative-since-1993 figure is shown on the US country page as historical context, not added to current totals.</p>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Build</h4>
        <p>Static + ISR (6h revalidate) on Vercel. CSP enforced. Released under MIT.</p>
      </div>
    </footer>
  );
}
