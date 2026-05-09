import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { fetchLive } from "@/lib/sources";
import { fmtDate } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";
import { outbreakSchema } from "@/lib/jsonld";
import { fetchWhoEvents } from "@/lib/sources/who";
import { getRouteForEvent } from "@/lib/event-routes";
import { COUNTRY_CENTROID } from "@/lib/geo";
import { Route, MapPin } from "lucide-react";
import type { Severity } from "@/lib/types";

const RouteMap = dynamic(() => import("@/components/maps/route-map").then((m) => m.RouteMap), {
  loading: () => <div className="h-[360px] flex items-center justify-center text-sm text-[var(--color-fg-muted)] rounded-lg border border-[var(--color-border)]">Loading route map…</div>,
});

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

  // Count how many WHO DON entries mention each country across the full set.
  // Pulled from the underlying WhoEvent.countries (which the parser populates
  // from the DON Overview text) — this is just *which countries are listed*,
  // not "case counts per country" (WHO doesn't break that down).
  const whoEvents = (await fetchWhoEvents()).events;
  const countryMentionCount = new Map<string, number>();
  for (const e of whoEvents) {
    for (const c of e.countries) {
      countryMentionCount.set(c, (countryMentionCount.get(c) ?? 0) + 1);
    }
  }
  // For *this* event, which countries are listed and how often have they
  // appeared across all hantavirus DONs in the live set.
  const thisWhoEv = whoEvents.find((w) => `who-${w.id}` === ev.id);
  const mentionedCountries = (thisWhoEv?.countries ?? []).map((name) => ({
    country: name,
    mentions: countryMentionCount.get(name) ?? 1,
  })).sort((a, b) => b.mentions - a.mentions);

  const route = getRouteForEvent(ev.id);

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

      {route && (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4 text-red-400" /> Event route
              </CardTitle>
              <CardSubtitle>{route.title}</CardSubtitle>
            </div>
            <Badge variant="brand">{route.waypoints.length} waypoints</Badge>
          </CardHeader>
          <RouteMap route={route} />
          <ol className="mt-5 space-y-2 text-sm">
            {route.waypoints.map((w, i) => (
              <li key={`${w.name}-${i}`} className="flex gap-3 items-start py-2 border-b border-[var(--color-border-soft)] last:border-b-0">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[11px] font-mono font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {w.flag ?? ""} {w.name}{w.country && w.country !== w.name ? `, ${w.country}` : ""}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                    <span className="uppercase tracking-wider font-bold mr-2">{w.kind}</span>
                    {w.date && <span className="mr-2">{fmtDate(w.date)}</span>}
                    {w.note && <span>· {w.note}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {mentionedCountries.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" /> Countries listed in this event
              </CardTitle>
              <CardSubtitle>
                {mentionedCountries.length} countr{mentionedCountries.length === 1 ? "y" : "ies"} · cross-counts show how often each appears across all live hantavirus DONs
              </CardSubtitle>
            </div>
          </CardHeader>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {mentionedCountries.map((m) => {
              const iso = isoFromName(m.country);
              return (
                <li key={m.country}>
                  {iso ? (
                    <Link
                      href={`/country/${iso}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--color-bg-hover)] border border-transparent hover:border-[var(--color-border-soft)]"
                    >
                      <span className="text-sm">{m.country}</span>
                      <span className="text-xs text-[var(--color-fg-muted)] font-mono">
                        {m.mentions} {m.mentions === 1 ? "DON" : "DONs"}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-sm">{m.country}</span>
                      <span className="text-xs text-[var(--color-fg-muted)] font-mono">
                        {m.mentions} {m.mentions === 1 ? "DON" : "DONs"}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
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

const NAME_TO_ISO: Record<string, string> = {
  Argentina: "ar",      Bolivia: "bo",         Brazil: "br",        Canada: "ca",
  Chile: "cl",          Mexico: "mx",          Paraguay: "py",      "United States": "us",
  Uruguay: "uy",        China: "cn",           Japan: "jp",         "South Korea": "kr",
  Russia: "ru",         Austria: "at",         Belgium: "be",       Czechia: "cz",
  Denmark: "dk",        Estonia: "ee",         Finland: "fi",       France: "fr",
  Germany: "de",        Greece: "gr",          Italy: "it",         Netherlands: "nl",
  Norway: "no",         Poland: "pl",          Portugal: "pt",      Spain: "es",
  Sweden: "se",         Switzerland: "ch",     "United Kingdom": "gb",
  "South Africa": "za", "Cabo Verde": "cv",
};

function isoFromName(name: string): string | null {
  return NAME_TO_ISO[name] ?? null;
}
