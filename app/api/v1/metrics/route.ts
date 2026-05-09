import { NextResponse } from "next/server";
import { highestCfr, outbreaks, overallCfr, regionTotals, snapshotDate, strainAggregates, totalCases, totalDeaths } from "@/lib/metrics";
import { allRiskScores } from "@/lib/risk";

export const revalidate = 3600;

export async function GET() {
  const data = {
    snapshot: snapshotDate(),
    totals: {
      cases: totalCases(),
      deaths: totalDeaths(),
      cfr_pct: +overallCfr().toFixed(2),
      outbreaks: outbreaks().length,
    },
    by_region: regionTotals(),
    by_strain: strainAggregates(),
    highest_cfr: highestCfr() ? { country: highestCfr()!.row.country, iso: highestCfr()!.row.iso, cfr_pct: +highestCfr()!.pct.toFixed(2) } : null,
    risk_top_5: allRiskScores().slice(0, 5),
  };
  return NextResponse.json(data, {
    headers: {
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}
