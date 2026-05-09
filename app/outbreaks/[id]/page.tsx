import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { outbreakEvents, surveillanceData } from "@/lib/data";
import { cfr, fmt, fmtCfr, fmtDate } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";
import { outbreakSchema } from "@/lib/jsonld";
import type { Severity } from "@/lib/types";

const SEVERITY_BADGE: Record<Severity, BadgeVariant> = {
  high: "outbreak",
  medium: "warn",
  low: "monitored",
};

interface Params { id: string; }

export async function generateStaticParams(): Promise<Params[]> {
  return outbreakEvents.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const ev = outbreakEvents.find((e) => e.id === id);
  if (!ev) return { title: "Outbreak not found" };
  return {
    title: ev.title,
    description: ev.body,
    openGraph: {
      title: ev.title,
      description: ev.body,
      images: [{ url: `/api/og/outbreak/${ev.id}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [`/api/og/outbreak/${ev.id}`] },
    alternates: { canonical: `/outbreaks/${ev.id}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const ev = outbreakEvents.find((e) => e.id === id);
  if (!ev) notFound();

  const country = surveillanceData.find((r) => r.iso === ev.iso);
  const related = outbreakEvents
    .filter((e) => e.id !== ev.id && (e.iso === ev.iso || e.severity === ev.severity))
    .slice(0, 3);

  return (
    <>
      <JsonLd data={outbreakSchema(ev)} />
      <Topbar title={ev.title} subtitle={`${ev.flag} ${ev.country} · ${fmtDate(ev.date)}`} />

      <Card className={`mb-8 border-l-[3px] ${ev.severity === "high" ? "border-l-red-500" : ev.severity === "medium" ? "border-l-amber-500" : "border-l-blue-500"}`}>
        <CardHeader>
          <div>
            <CardTitle>Event detail</CardTitle>
            <CardSubtitle>Most recent reporting</CardSubtitle>
          </div>
          <Badge variant={SEVERITY_BADGE[ev.severity]}>{ev.severity} severity</Badge>
        </CardHeader>
        <p className="text-[var(--color-fg-secondary)] leading-relaxed">{ev.body}</p>
        {ev.source && (
          <div className="mt-5 pt-4 border-t border-[var(--color-border-soft)] text-sm">
            <span className="text-[var(--color-fg-muted)]">Source: </span>
            {ev.sourceUrl ? (
              <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:text-blue-300">
                {ev.source} ↗
              </a>
            ) : (
              <span className="font-medium">{ev.source}</span>
            )}
          </div>
        )}
      </Card>

      {country && (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <CardTitle>{country.flag} {country.country} — current snapshot</CardTitle>
              <CardSubtitle>{country.strain}</CardSubtitle>
            </div>
            <Link href={`/country/${country.iso}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
              Country page →
            </Link>
          </CardHeader>
          <div className="grid grid-cols-3 gap-3">
            <KV label="Cases" value={fmt(country.cases)} />
            <KV label="Deaths" value={fmt(country.deaths)} />
            <KV label="CFR" value={fmtCfr(cfr(country.deaths, country.cases))} />
          </div>
        </Card>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold tracking-tight mb-4">Related events</h2>
          <div className="space-y-2.5">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/outbreaks/${r.id}`}
                className="block p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md hover:border-[var(--color-border-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold mb-0.5">{r.flag} {r.title}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">{fmtDate(r.date)}</div>
                  </div>
                  <Badge variant={SEVERITY_BADGE[r.severity]}>{r.severity}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-0.5">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}
