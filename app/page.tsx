import Link from "next/link";
import { Globe2, Siren, Skull, TrendingUp, ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/cards/stat-card";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { StrainDonut } from "@/components/charts/strain-donut";
import { WorldMap } from "@/components/maps/world-map";
import { AlertFeed } from "@/components/alert-feed";
import { surveillanceData, weeklyTimeline, dataSources } from "@/lib/data";
import {
  highestCfr,
  outbreaks,
  overallCfr,
  recentEvents,
  strainAggregates,
  totalCases,
  totalDeaths,
} from "@/lib/metrics";
import { fmt, fmtCfr } from "@/lib/format";

export default function DashboardPage() {
  const cases = totalCases();
  const deaths = totalDeaths();
  const cfrPct = overallCfr();
  const ob = outbreaks();
  const top = highestCfr();
  const strains = strainAggregates();
  const events = recentEvents(5);

  const americas = surveillanceData.filter((r) => r.region === "Americas").sort((a, b) => b.cases - a.cases);
  const europe = surveillanceData.filter((r) => r.region === "Europe").sort((a, b) => b.cases - a.cases);
  const asia = surveillanceData.filter((r) => r.region === "Asia").sort((a, b) => b.cases - a.cases);

  return (
    <>
      <Topbar title="Global Surveillance" subtitle="Snapshot of current hantavirus activity worldwide" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total cases"
          value={fmt(cases)}
          meta={`across ${surveillanceData.length} countries tracked`}
          icon={<Globe2 className="h-4 w-4" />}
          accent="danger"
        />
        <StatCard
          title="Active outbreaks"
          value={ob.length}
          meta={ob.length > 0 ? ob.map((o) => o.country).slice(0, 3).join(" · ") + (ob.length > 3 ? " …" : "") : "no countries flagged"}
          icon={<Siren className="h-4 w-4" />}
          accent="warn"
        />
        <StatCard
          title="Total deaths"
          value={fmt(deaths)}
          meta={`CFR ${fmtCfr(cfrPct)} overall`}
          icon={<Skull className="h-4 w-4" />}
          accent="purple"
        />
        <StatCard
          title="Highest CFR"
          value={top ? fmtCfr(top.pct) : "—"}
          meta={top ? `${top.row.country} · ${top.row.strain}` : "—"}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="brand"
        />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Global activity map</CardTitle>
            <CardSubtitle>Hover any country for a quick read · click an active country for the deep dive</CardSubtitle>
          </div>
        </CardHeader>
        <WorldMap data={surveillanceData} />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Cases over time</CardTitle>
              <CardSubtitle>Weekly new cases, last 12 weeks</CardSubtitle>
            </div>
          </CardHeader>
          <TimelineChart data={weeklyTimeline} />
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>By strain</CardTitle>
              <CardSubtitle>Cases distribution</CardSubtitle>
            </div>
          </CardHeader>
          <StrainDonut data={strains} />
        </Card>
      </div>

      <section className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Regional surveillance</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Top countries by case volume in each region</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RegionalCard title="Americas" subtitle="HCPS · high mortality" rows={americas.slice(0, 4)} />
          <RegionalCard title="Europe" subtitle="HFRS · lower mortality" rows={europe.slice(0, 4)} />
          <RegionalCard title="Asia" subtitle="HFRS · highest case load" rows={asia.slice(0, 4)} />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Recent alerts</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Most recent surveillance signals</p>
          </div>
          <Link href="/outbreaks">
            <Button>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <AlertFeed events={events} />
      </section>

      <Footer />
    </>
  );
}

function RegionalCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: typeof surveillanceData }) {
  const total = rows.reduce((s, r) => s + r.cases, 0);
  const max = rows[0]?.cases ?? 1;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardSubtitle>{subtitle}</CardSubtitle>
        </div>
        <div className="font-mono text-base font-bold">{fmt(total)}</div>
      </CardHeader>
      <div>
        {rows.map((r) => {
          const pct = (r.cases / max) * 100;
          const color =
            r.status === "outbreak" ? "#ef4444" : r.status === "active" ? "#3b82f6" : "#22c55e";
          return (
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
                  <div className="text-xs text-[var(--color-fg-muted)] truncate">{r.strain}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-16 h-1.5 bg-[var(--color-bg-tertiary)] rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="text-xs font-mono font-semibold w-16 text-right text-[var(--color-fg-secondary)]">
                  {fmt(r.cases)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function Footer() {
  return (
    <footer className="mt-12 pt-6 border-t border-[var(--color-border-soft)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-[var(--color-fg-muted)]">
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Data sources</h4>
        {dataSources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="block py-0.5 hover:text-blue-400">
            {s.name} ↗
          </a>
        ))}
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">About</h4>
        <p>This dashboard is illustrative and aggregates publicly reported figures. For clinical or policy decisions, consult the original source data linked above.</p>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Methodology</h4>
        <p>Cumulative cases reflect 2025–2026 reporting where available. CFR is computed as deaths/cases for each entry. Regional aggregates use WHO regional groupings.</p>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-secondary)] mb-2.5">Build</h4>
        <p>Static + ISR deployment on Vercel. CSP enforced. Released under MIT.</p>
      </div>
    </footer>
  );
}
