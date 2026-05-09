import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { strains } from "@/lib/data";
import { fetchLive } from "@/lib/sources";
import { fetchWikiSummary, STRAIN_WIKI_SLUG } from "@/lib/sources/wikipedia";
import { fetchReservoir } from "@/lib/sources/gbif";
import { cfr, fmt, fmtCfr } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";
import { strainSchema } from "@/lib/jsonld";
import { ExternalLink } from "lucide-react";

interface Params { name: string; }

const slug = (s: string) => s.toLowerCase().replace(/[ /]/g, "-");

export const revalidate = 21600;

export async function generateStaticParams(): Promise<Params[]> {
  return strains.map((s) => ({ name: slug(s.name) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { name } = await params;
  const s = strains.find((x) => slug(x.name) === name);
  if (!s) return { title: "Strain not found" };
  const description = `${s.name} virus — ${s.syndrome}, reservoir ${s.reservoir}, CFR ${s.cfrRange[0]}–${s.cfrRange[1]}%.`;
  return {
    title: `${s.name} virus`,
    description,
    openGraph: {
      title: `${s.name} virus · HantaWatch`,
      description,
      images: [{ url: `/api/og/strain/${slug(s.name)}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [`/api/og/strain/${slug(s.name)}`] },
    alternates: { canonical: `/strain/${slug(s.name)}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { name } = await params;
  const s = strains.find((x) => slug(x.name) === name);
  if (!s) notFound();

  const wikiSlug = STRAIN_WIKI_SLUG[s.name];
  const [{ countries }, wiki, reservoir] = await Promise.all([
    fetchLive(),
    wikiSlug ? fetchWikiSummary(wikiSlug) : Promise.resolve(null),
    fetchReservoir(s.name),
  ]);
  const reportingCountries = countries.filter((r) =>
    (r.strain ?? "").toLowerCase().includes(s.name.toLowerCase())
  );
  const totalCases = reportingCountries.reduce((sum, r) => sum + (r.cases ?? 0), 0);
  const totalDeaths = reportingCountries.reduce((sum, r) => sum + (r.deaths ?? 0), 0);
  const observedCfr = totalCases > 0 ? cfr(totalDeaths, totalCases) : 0;

  return (
    <>
      <JsonLd data={strainSchema(s)} />
      <Topbar
        title={`${s.name} virus`}
        subtitle={`${s.family} · causes ${s.syndrome}`}
        freshness="virology reference"
      />

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Overview</CardTitle>
            <CardSubtitle>Reference virology — does not change with surveillance data</CardSubtitle>
          </div>
          <Badge variant={s.syndrome === "HCPS" ? "outbreak" : "brand"}>{s.syndrome}</Badge>
        </CardHeader>
        <p className="text-[var(--color-fg-secondary)] leading-relaxed mb-6">{s.description}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <Field label="Family" value={s.family} />
          <Field label="Reservoir host" value={s.reservoir} />
          <Field label="Syndrome" value={s.syndrome} />
          <Field label="Typical CFR range" value={`${s.cfrRange[0]}–${s.cfrRange[1]}%`} />
          <Field
            label="Geographic range"
            value={
              <div className="flex flex-wrap gap-1.5 mt-1">
                {s.geographicRange.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded bg-[var(--color-bg-tertiary)]">{c}</span>
                ))}
              </div>
            }
          />
        </dl>
      </Card>

      {reservoir && reservoir.ok && (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <CardTitle>Reservoir taxonomy</CardTitle>
              <CardSubtitle>Live from GBIF · {reservoir.scientificName}</CardSubtitle>
            </div>
            <a href={reservoir.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-muted)] hover:text-blue-400">
              View on GBIF <ExternalLink className="inline h-3 w-3" />
            </a>
          </CardHeader>
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <Field label="Kingdom" value={reservoir.kingdom ?? "—"} />
            <Field label="Phylum" value={reservoir.phylum ?? "—"} />
            <Field label="Order" value={reservoir.order ?? "—"} />
            <Field label="Family" value={reservoir.family ?? "—"} />
            <Field label="Genus" value={reservoir.genus ?? "—"} />
            <Field label="Recorded" value={reservoir.occurrences != null ? `${fmt(reservoir.occurrences)} occurrences` : "—"} />
          </dl>
        </Card>
      )}

      {wiki && wiki.ok && wiki.extract && (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <CardTitle>Encyclopedia</CardTitle>
              <CardSubtitle>Live summary from Wikipedia · {wiki.title}</CardSubtitle>
            </div>
            <a href={wiki.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              Read on Wikipedia <ExternalLink className="inline h-3 w-3" />
            </a>
          </CardHeader>
          <p className="text-[var(--color-fg-secondary)] leading-relaxed">{wiki.extract}</p>
        </Card>
      )}

      {reportingCountries.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <CardTitle>Live reporting</CardTitle>
              <CardSubtitle>Countries currently flagged with {s.name} virus in the live feed</CardSubtitle>
            </div>
            <div className="text-right text-sm">
              <div className="font-mono font-semibold">{totalCases > 0 ? `${fmt(totalCases)} cases` : "—"}</div>
              <div className="text-[var(--color-fg-muted)] text-xs">
                {totalCases > 0 ? `CFR ${fmtCfr(observedCfr)} observed` : "no published case counts"}
              </div>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {reportingCountries.map((r) => (
              <Link
                key={r.iso}
                href={`/country/${r.iso}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.flag}</span>
                  <div>
                    <div className="font-semibold text-sm">{r.country}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">{r.region} · {r.source}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-mono">{r.cases != null ? `${fmt(r.cases)} cases` : "—"}</div>
                  <div className="text-xs text-[var(--color-fg-muted)]">{r.deaths != null ? `${fmt(r.deaths)} deaths` : "—"}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
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
