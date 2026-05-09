/**
 * Source health endpoint.
 *
 * Pings every active source adapter and reports per-source status, latency,
 * and a sample value. Surfaced publicly at /api/health/sources so any user
 * can verify our claim that every number on the dashboard traces to a real
 * source. Used by the /methodology page and /status page.
 *
 * No auth — health is public; cached short (5 minutes).
 */

import { NextResponse } from "next/server";
import { fetchLive } from "@/lib/sources";
import { fetchResearch } from "@/lib/sources/research";
import { fetchReservoir } from "@/lib/sources/gbif";

export const revalidate = 300;

export async function GET() {
  const started = Date.now();
  const [live, research, gbif] = await Promise.all([
    fetchLive(),
    fetchResearch(),
    fetchReservoir("Sin Nombre"),
  ]);

  const sources = [
    ...live.sources.map((s) => ({
      id: s.source.toLowerCase().replace(/\s+/g, "-"),
      source: s.source,
      category: "surveillance" as const,
      ok: s.ok,
      detail: s.detail,
      fetched_at: s.fetchedAt,
      url: s.url,
    })),
    {
      id: "europepmc",
      source: "EuropePMC",
      category: "research" as const,
      ok: research.publications.ok,
      detail: research.publications.ok
        ? `${research.publications.totalHits.toLocaleString()} papers indexed; ${research.publications.recentPapers.length} recent in this fetch`
        : "fetch failed",
      fetched_at: research.publications.fetchedAt,
      url: research.publications.sourceUrl,
    },
    {
      id: "biorxiv",
      source: "bioRxiv / medRxiv",
      category: "research" as const,
      ok: research.preprints.ok,
      detail: research.preprints.ok
        ? `${research.preprints.count} hantavirus preprints in last 90 days`
        : "fetch failed",
      fetched_at: research.preprints.fetchedAt,
      url: research.preprints.sourceUrl,
    },
    {
      id: "wikipedia-pageviews",
      source: "Wikipedia pageviews (Wikimedia)",
      category: "research" as const,
      ok: research.pageviews.ok,
      detail: research.pageviews.ok
        ? `${research.pageviews.totalLast30d.toLocaleString()} views in last 30 days`
        : "fetch failed",
      fetched_at: research.pageviews.fetchedAt,
      url: research.pageviews.sourceUrl,
    },
    {
      id: "gbif",
      source: "GBIF",
      category: "reference" as const,
      ok: !!gbif?.ok,
      detail: gbif?.ok
        ? `${gbif.scientificName} · ${gbif.occurrences?.toLocaleString() ?? "?"} occurrences`
        : "fetch failed",
      fetched_at: new Date().toISOString(),
      url: "https://www.gbif.org/",
    },
  ];

  const okCount = sources.filter((s) => s.ok).length;
  const finished = Date.now();

  return NextResponse.json(
    {
      ok: okCount === sources.length,
      summary: `${okCount}/${sources.length} sources operational`,
      latency_ms: finished - started,
      checked_at: new Date().toISOString(),
      sources,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
        "access-control-allow-origin": "*",
      },
    }
  );
}
