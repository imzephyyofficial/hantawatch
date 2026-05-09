import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { AlertFeed } from "@/components/alert-feed";
import { surveillanceData, outbreakEvents, dataSources } from "@/lib/data";
import { cfr, fmt, fmtCfr, fmtDate } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";
import { countrySchema } from "@/lib/jsonld";
import type { Status } from "@/lib/types";

const STATUS_BADGE: Record<Status, BadgeVariant> = {
  active: "active",
  outbreak: "outbreak",
  monitored: "monitored",
};

interface Params { iso: string; }

export async function generateStaticParams(): Promise<Params[]> {
  return surveillanceData.map((r) => ({ iso: r.iso }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { iso } = await params;
  const row = surveillanceData.find((r) => r.iso === iso);
  if (!row) return { title: "Country not found" };
  const description = `${row.country} hantavirus surveillance — ${fmt(row.cases)} cases, ${fmt(row.deaths)} deaths, CFR ${fmtCfr(cfr(row.deaths, row.cases))} (${row.strain}).`;
  return {
    title: row.country,
    description,
    openGraph: {
      title: `${row.flag} ${row.country} · HantaWatch`,
      description,
      images: [{ url: `/api/og/country/${row.iso}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [`/api/og/country/${row.iso}`] },
    alternates: { canonical: `/country/${row.iso}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { iso } = await params;
  const row = surveillanceData.find((r) => r.iso === iso);
  if (!row) notFound();

  const pct = cfr(row.deaths, row.cases);
  const events = outbreakEvents.filter((e) => e.iso === iso);
  const peers = surveillanceData
    .filter((r) => r.region === row.region && r.iso !== iso)
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 4);

  return (
    <>
      <JsonLd data={countrySchema(row)} />
      <Topbar title={`${row.flag} ${row.country}`} subtitle={`${row.region} · ${row.strain}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat title="Cases" value={fmt(row.cases)} />
        <Stat title="Deaths" value={fmt(row.deaths)} />
        <Stat title="CFR" value={fmtCfr(pct)} accent={pct >= 20 ? "danger" : pct >= 5 ? "warn" : "success"} />
        <Stat title="Status" value={<Badge variant={STATUS_BADGE[row.status]}>{row.status}</Badge>} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardSubtitle>Demographics and reporting</CardSubtitle>
          </div>
        </CardHeader>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <Field label="Region" value={row.region} />
          <Field label="Predominant strain" value={
            <Link href={`/strain/${row.strain.replace(/ \(imported\)/i, "").toLowerCase().replace(/[ /]/g, "-")}`} className="text-blue-400 hover:text-blue-300">
              {row.strain}
            </Link>
          } />
          <Field label="Last report" value={fmtDate(row.lastReport)} />
          {row.population && <Field label="Population" value={fmt(row.population)} />}
          <Field label="Cases per million" value={row.population ? fmt(Math.round((row.cases / row.population) * 1_000_000)) : "—"} />
          <Field label="Deaths per million" value={row.population ? fmt(Math.round((row.deaths / row.population) * 1_000_000)) : "—"} />
        </dl>
      </Card>

      {events.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">Recent events in {row.country}</h2>
          <AlertFeed events={events} />
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
                    <div className="text-xs text-[var(--color-fg-muted)]">{p.strain}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold">{fmt(p.cases)} cases</div>
                  <div className="text-xs text-[var(--color-fg-muted)]">CFR {fmtCfr(cfr(p.deaths, p.cases))}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Source documents</CardTitle>
            <CardSubtitle>Verify against original publishers</CardSubtitle>
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
