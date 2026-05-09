import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { fetchLive } from "@/lib/sources";
import { fmtDate } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";
import { outbreakSchema } from "@/lib/jsonld";
import type { Severity } from "@/lib/types";

const SEVERITY_BADGE: Record<Severity, BadgeVariant> = {
  high: "outbreak",
  medium: "warn",
  low: "monitored",
};

interface Params { id: string; }

export const revalidate = 21600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const { events } = await fetchLive();
  return events.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const { events } = await fetchLive();
  const ev = events.find((e) => e.id === id);
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
  const { events } = await fetchLive();
  const ev = events.find((e) => e.id === id);
  if (!ev) notFound();

  const related = events
    .filter((e) => e.id !== ev.id && (e.iso === ev.iso || e.severity === ev.severity))
    .slice(0, 4);

  return (
    <>
      <JsonLd data={outbreakSchema(ev)} />
      <Topbar title={ev.title} subtitle={`${ev.flag} ${ev.country} · ${fmtDate(ev.date)}`} snapshotDate={ev.date} freshness="WHO" />

      {ev.breakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-8">
          <BreakdownStat label="Reported" value={ev.breakdown.reported} accent="text-red-400" />
          <BreakdownStat label="Confirmed" value={ev.breakdown.confirmed} accent="text-amber-400" />
          <BreakdownStat label="Probable" value={ev.breakdown.probable} accent="text-amber-300" />
          <BreakdownStat label="Hospitalized" value={ev.breakdown.hospitalized} accent="text-cyan-400" />
          <BreakdownStat label="Critical" value={ev.breakdown.critical} accent="text-cyan-300" />
          <BreakdownStat label="Deceased" value={ev.breakdown.deceased} accent="text-purple-400" />
          <BreakdownStat label="Recovered" value={ev.breakdown.recovered} accent="text-emerald-400" />
        </div>
      )}

      <Card className={`mb-8 border-l-[3px] ${ev.severity === "high" ? "border-l-red-500" : ev.severity === "medium" ? "border-l-amber-500" : "border-l-blue-500"}`}>
        <CardHeader>
          <div>
            <CardTitle>WHO Disease Outbreak News</CardTitle>
            <CardSubtitle>Live entry from the WHO API · figures parsed from the official Summary text</CardSubtitle>
          </div>
          <Badge variant={SEVERITY_BADGE[ev.severity]}>{ev.severity} severity</Badge>
        </CardHeader>
        <p className="text-[var(--color-fg-secondary)] leading-relaxed whitespace-pre-line">{ev.body}</p>
        {ev.sourceUrl && (
          <div className="mt-5 pt-4 border-t border-[var(--color-border-soft)] text-sm">
            <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:text-blue-300">
              Read full WHO DON entry ↗
            </a>
          </div>
        )}
      </Card>

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

function BreakdownStat({ label, value, accent }: { label: string; value: number | null; accent: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-1">{label}</div>
      <div className={`text-2xl font-extrabold font-mono tabular-nums ${value != null ? accent : "text-[var(--color-fg-muted)]"}`}>
        {value != null ? value.toLocaleString("en-US") : "—"}
      </div>
    </div>
  );
}
