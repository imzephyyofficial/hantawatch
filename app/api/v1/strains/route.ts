import { NextResponse } from "next/server";
import { strains } from "@/lib/data";
import { strainAggregates } from "@/lib/metrics";

export const revalidate = 3600;

export async function GET() {
  const aggregates = Object.fromEntries(strainAggregates().map((g) => [g.name, g]));
  const data = strains.map((s) => ({
    ...s,
    observed: aggregates[s.name] ?? { name: s.name, cases: 0, deaths: 0, countries: 0, cfr: 0 },
  }));
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
