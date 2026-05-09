import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { AlertFeed } from "@/components/alert-feed";
import { fetchLive } from "@/lib/sources";
import { dataSources } from "@/lib/data";
import { cfr, fmt, fmtCfr, fmtDate } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";
import { countrySchema } from "@/lib/jsonld";
import { UsWeeklyChart } from "@/components/charts/us-weekly-chart";
import type { Status } from "@/lib/types";

const STATUS_BADGE: Record<Status, BadgeVariant> = {
  active: "active",
  outbreak: "outbreak",
  monitored: "monitored",
};

interface Params { iso: string; }

export const revalidate = 21600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const { countries } = await fetchLive();
  return countries.map((r) => ({ iso: r.iso }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { iso } = await params;
  const { countries } = await fetchLive();
  const row = countries.find((r) => r.iso === iso);
  if (!row) return { title: "Country not found" };
  const desc = row.cases != null
    ? `${row.country} hantavirus surveillance — ${fmt(row.cases)} cases (${row.source}).`
    : `${row.country} listed in current WHO Disease Outbreak News for hantavirus.`;
  return {
    title: row.country,
    description: desc,
    openGraph: {
      title: `${row.flag} ${row.country} · HantaWatch`,
      description: desc,
      images: [{ url: `/api/og/country/${row.iso}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [`/api/og/country/${row.iso}`] },
    alternates: { canonical: `/country/${row.iso}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { iso } = await params;
  const { countries, events, usWeekly } = await fetchLive();
  const row = countries.find((r) => r.iso === iso);
  if (!row) notFound();

  const pct = row.cases != null && row.deaths != null ? cfr(row.deaths, row.cases) : null;
  const countryEvents = events.filter((e) => e.iso === iso || e.country === row.country);
  const peers = countries
    .filter((r) => r.region === row.region && r.iso !== iso)
    .slice(0, 4);

  return (
    <>
      <JsonLd data={countrySchema(row)} />
      <Topbar
        title={`${row.flag} ${row.country}`}
        subtitle={`${row.region} · ${row.strain ?? "Strain TBD"}`}
        snapshotDate={row.lastReport}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat title="Cases" value={row.cases != null ? fmt(row.cases) : "—"} />
        <Stat title="Deaths" value={row.deaths != null ? fmt(row.deaths) : "—"} />
        <Stat title="CFR" value={pct != null ? fmtCfr(pct) : "—"} accent={pct != null ? (pct >= 20 ? "danger" : pct >= 5 ? "warn" : "success") : undefined} />
        <Stat title="Status" value={row.status ? <Badge variant={STATUS_BADGE[row.status]}>{row.status}</Badge> : "—"} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardSubtitle>What we know from {row.source}</CardSubtitle>
          </div>
        </CardHeader>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <Field label="Region" value={row.region} />
          <Field
            label="Predominant strain"
            value={
              row.strain ? (
                <Link
                  href={`/strain/${row.strain.replace(/ \(imported\)/i, "").toLowerCase().replace(/[ /]/g, "-")}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {row.strain}
                </Link>
              ) : (
                <span className="text-[var(--color-fg-muted)]">Not reported</span>
              )
            }
          />
          <Field label="Last report" value={fmtDate(row.lastReport)} />
          {row.population && <Field label="Population" value={fmt(row.population)} />}
          <Field label="Cases per million" value={row.population && row.cases != null ? fmt(Math.round((row.cases / row.population) * 1_000_000)) : "—"} />
          <Field label="Deaths per million" value={row.population && row.deaths != null ? fmt(Math.round((row.deaths / row.population) * 1_000_000)) : "—"} />
          <Field
            label="Source"
            value={
              <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {row.source} ↗
              </a>
            }
          />
          {row.notes && <Field label="Notes" value={row.notes} />}
        </dl>
      </Card>

      {iso === "us" && usWeekly.ok && usWeekly.weeklyHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">US weekly NNDSS reporting</h2>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Last {usWeekly.weeklyHistory.length} reporting weeks</CardTitle>
                <CardSubtitle>
                  CDC NNDSS · cumulative YTD per label · most recent: {usWeekly.reportingYear} week {usWeekly.reportingWeek}
                </CardSubtitle>
              </div>
            </CardHeader>
            <UsWeeklyChart data={usWeekly.weeklyHistory} />
          </Card>
        </section>
      )}

      {iso === "us" && usWeekly.ok && usWeekly.stateRows.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">Per-state breakdown ({usWeekly.reportingYear})</h2>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{usWeekly.stateRows.length} states with cases</CardTitle>
                <CardSubtitle>YTD cumulative count from CDC NNDSS</CardSubtitle>
              </div>
              <div className="font-mono text-base font-bold">
                {usWeekly.stateRows.reduce((s, r) => s + r.cumulative, 0)} total
              </div>
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {usWeekly.stateRows.slice(0, 30).map((s) => (
                <div key={s.state} className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-tertiary)] text-sm">
                  <span>{s.state}</span>
                  <span className="font-mono font-semibold">{s.cumulative}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {countryEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">WHO entries mentioning {row.country}</h2>
          <AlertFeed events={countryEvents} />
        </section>
      )}

      {peers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">Peer countries in {row.region}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {peers.map((p) => (
              <Link
                key={p.iso}
                href={`/country/${p.iso}`}
                className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md hover:border-[var(--color-border-soft)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.flag}</span>
                  <div>
                    <div className="font-semibold text-sm">{p.country}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">{p.strain ?? "Strain TBD"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold">{p.cases != null ? `${fmt(p.cases)} cases` : "—"}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Verify against publishers</CardTitle>
            <CardSubtitle>This row's source is {row.source}; here's where to cross-check</CardSubtitle>
          </div>
        </CardHeader>
        <ul className="space-y-2 text-sm">
          {dataSources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {s.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Stat({ title, value, accent }: { title: string; value: React.ReactNode; accent?: "danger" | "warn" | "success" }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">{title}</div>
      <div
        className={`text-2xl font-extrabold font-mono tabular-nums ${
          accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : accent === "success" ? "text-emerald-400" : ""
        }`}
      >
        {value}
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)] font-semibold">{label}</dt>
      <dd className="text-sm mt-0.5">{value}</dd>
    </div>
  );
}
