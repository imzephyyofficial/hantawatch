import Link from "next/link";
import { Globe2, Siren, Skull, TrendingUp, Radio, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/cards/stat-card";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StrainDonut } from "@/components/charts/strain-donut";
import { EventFrequencyChart } from "@/components/charts/event-frequency";
import { WorldMap } from "@/components/maps/world-map";
import { AlertFeed } from "@/components/alert-feed";
import { dataSources } from "@/lib/data";
import { fetchLive } from "@/lib/sources";
import {
  highestCfr,
  outbreakRows,
  overallCfr,
  regionTotals,
  snapshotDate,
  strainAggregates,
  totalCases,
  totalDeaths,
} from "@/lib/metrics";
import { fmt, fmtCfr, fmtDate } from "@/lib/format";

export const revalidate = 21600;

export default async function DashboardPage() {
  const live = await fetchLive();
  const { countries, events, sources } = live;

  const cases = totalCases(countries);
  const deaths = totalDeaths(countries);
  const cfrPct = overallCfr(countries);
  const ob = outbreakRows(countries);
  const top = highestCfr(countries);
  const strains = strainAggregates(countries).filter((s) => s.cases > 0);
  const regions = regionTotals(countries);

  // event frequency by year (live)
  const yearCounts = new Map<string, number>();
  for (const e of events) {
    const y = e.date.slice(0, 4);
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
  }
  const eventFreq = Array.from(yearCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, count]) => ({ period, count }));

  return (
    <>
      <Topbar
        title="Global Surveillance"
        subtitle="Live hantavirus activity pulled from WHO Disease Outbreak News and CDC"
        snapshotDate={snapshotDate(countries)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Reported cases"
          value={cases > 0 ? fmt(cases) : "—"}
          meta={cases > 0 ? `across ${countries.filter((c) => c.cases != null && c.cases > 0).length} reporting countries` : "no live counts available"}
          icon={<Globe2 className="h-4 w-4" />}
          accent="danger"
        />
        <StatCard
          title="Active WHO alerts"
          value={events.length}
          meta={
            events.length > 0
              ? events.slice(0, 1).map((e) => e.title.slice(0, 42) + (e.title.length > 42 ? "…" : ""))[0]
              : "no active WHO Disease Outbreak News"
          }
          icon={<Siren className="h-4 w-4" />}
          accent="warn"
        />
        <StatCard
          title="Reported deaths"
          value={deaths > 0 ? fmt(deaths) : "—"}
          meta={cfrPct > 0 ? `CFR ${fmtCfr(cfrPct)} from reporting set` : "no death figures published"}
          icon={<Skull className="h-4 w-4" />}
          accent="purple"
        />
        <StatCard
          title="Highest reported CFR"
          value={top ? fmtCfr(top.pct) : "—"}
          meta={top ? `${top.row.country} · ${top.row.strain ?? "strain TBD"}` : "no rows with both cases and deaths"}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="brand"
        />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Live activity map</CardTitle>
            <CardSubtitle>
              {countries.length === 0
                ? "Awaiting WHO + CDC data — no countries currently flagged"
                : `${countries.length} countr${countries.length === 1 ? "y" : "ies"} flagged · hover for detail`}
            </CardSubtitle>
          </div>
        </CardHeader>
        <WorldMap data={countries} />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>WHO Disease Outbreak News — by year</CardTitle>
              <CardSubtitle>Hantavirus DON publication frequency from the WHO API</CardSubtitle>
            </div>
          </CardHeader>
          {eventFreq.length > 0 ? (
            <EventFrequencyChart data={eventFreq} />
          ) : (
            <div className="text-sm text-[var(--color-fg-muted)] py-12 text-center">No DON entries returned.</div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>By strain</CardTitle>
              <CardSubtitle>Live reporting set</CardSubtitle>
            </div>
          </CardHeader>
          {strains.length > 0 ? (
            <StrainDonut data={strains} />
          ) : (
            <div className="text-sm text-[var(--color-fg-muted)] py-12 text-center px-4">
              No country in the current live set has a published case count.
            </div>
          )}
        </Card>
      </div>

      <section className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Regional reporting</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Aggregated from countries currently reporting</p>
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
                  Live · last fetch {fmtDate(live.fetchedAt.slice(0, 10))} · {events.length} entr{events.length === 1 ? "y" : "ies"}
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

function Footer({ sources }: { sources: Array<{ source: string; ok: boolean; detail?: string }> }) {
  return (
    <footer className="mt-12 pt-6 border-t border-[var(--color-border-soft)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-[var(--color-fg-muted)]">
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Live sources</h4>
        {sources.map((s) => (
          <div key={s.source} className="py-0.5 flex items-center gap-2">
            <span className={s.ok ? "text-emerald-400" : "text-amber-400"}>●</span>
            <span>{s.source}</span>
            <span className="text-[var(--color-fg-muted)]">— {s.detail}</span>
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
        <p>Country counts come from CDC for the United States and from WHO DON entries for countries currently flagged. CFR is computed only when both cases and deaths are published. No estimated or imputed figures.</p>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Build</h4>
        <p>Static + ISR (6h revalidate) on Vercel. CSP enforced. Released under MIT.</p>
      </div>
    </footer>
  );
}
