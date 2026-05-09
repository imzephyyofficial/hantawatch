import { NextResponse } from "next/server";
import { fetchLive } from "@/lib/sources";
import { highestCfr, outbreakRows, overallCfr, regionTotals, snapshotDate, strainAggregates, totalCases, totalDeaths } from "@/lib/metrics";
import { allRiskScores } from "@/lib/risk";

export const revalidate = 21600;

export async function GET() {
  const { countries, events, fetchedAt, sources, totals, usWeekly } = await fetchLive();
  const top = highestCfr(countries);
  const data = {
    snapshot: snapshotDate(countries),
    fetched_at: fetchedAt,
    sources,
    breakdown: totals,
    totals: {
      cases: totalCases(countries),
      deaths: totalDeaths(countries),
      cfr_pct: +overallCfr(countries).toFixed(2),
      countries_with_data: countries.length,
      who_events: events.length,
      flagged_countries: outbreakRows(countries).length,
    },
    us_weekly: usWeekly.ok
      ? {
          reporting_year: usWeekly.reportingYear,
          reporting_week: usWeekly.reportingWeek,
          ytd_hps: usWeekly.ytdHps,
          ytd_non_hps_infection: usWeekly.ytdNonHps,
          ytd_combined: usWeekly.ytdCombined,
          states_reporting: usWeekly.stateRows.length,
          weekly_history: usWeekly.weeklyHistory,
        }
      : null,
    by_region: regionTotals(countries),
    by_strain: strainAggregates(countries),
    highest_cfr: top
      ? { country: top.row.country, iso: top.row.iso, cfr_pct: +top.pct.toFixed(2) }
      : null,
    risk_top_5: allRiskScores(countries).slice(0, 5),
  };
  return NextResponse.json(data, {
    headers: {
      "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}
