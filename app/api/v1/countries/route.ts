import { NextResponse } from "next/server";
import { surveillanceData } from "@/lib/data";
import { cfr } from "@/lib/format";

export const revalidate = 3600;

function toCsv() {
  const cols = ["iso", "country", "region", "cases", "deaths", "cfr_pct", "strain", "last_report", "status", "population"];
  const lines = [cols.join(",")];
  for (const r of surveillanceData) {
    lines.push(
      [r.iso, r.country, r.region, r.cases, r.deaths, cfr(r.deaths, r.cases).toFixed(2), r.strain, r.lastReport, r.status, r.population ?? ""]
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

  let rows = surveillanceData;
  if (region) rows = rows.filter((r) => r.region.toLowerCase() === region.toLowerCase());
  if (status) rows = rows.filter((r) => r.status === status);

  if (format === "csv") {
    return new NextResponse(toCsv(), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  const data = rows.map((r) => ({ ...r, cfr_pct: +cfr(r.deaths, r.cases).toFixed(2) }));
  return NextResponse.json(
    { count: data.length, data },
    {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    }
  );
}
