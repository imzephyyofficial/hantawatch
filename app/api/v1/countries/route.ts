import { NextResponse } from "next/server";
import { fetchLive } from "@/lib/sources";
import { cfr } from "@/lib/format";

export const revalidate = 21600;

function toCsv(rows: Awaited<ReturnType<typeof fetchLive>>["countries"]) {
  const cols = ["iso", "country", "region", "cases", "deaths", "cfr_pct", "strain", "last_report", "status", "population", "source", "source_url"];
  const lines = [cols.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.iso,
        r.country,
        r.region,
        r.cases ?? "",
        r.deaths ?? "",
        r.cases != null && r.deaths != null ? cfr(r.deaths, r.cases).toFixed(2) : "",
        r.strain ?? "",
        r.lastReport,
        r.status ?? "",
        r.population ?? "",
        r.source,
        r.sourceUrl,
      ]
        .map((v) => {
          const s = String(v ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    );
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const region = url.searchParams.get("region");
  const status = url.searchParams.get("status");

  const { countries, fetchedAt, sources } = await fetchLive();
  let rows = countries;
  if (region) rows = rows.filter((r) => r.region.toLowerCase() === region.toLowerCase());
  if (status) rows = rows.filter((r) => r.status === status);

  if (format === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  }

  const data = rows.map((r) => ({
    ...r,
    cfr_pct: r.cases != null && r.deaths != null ? +cfr(r.deaths, r.cases).toFixed(2) : null,
  }));

  return NextResponse.json(
    { count: data.length, fetched_at: fetchedAt, sources, data },
    {
      headers: {
        "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    }
  );
}
