import { surveillanceData, outbreakEvents } from "./data";
import type { StrainAggregate, SurveillanceRecord } from "./types";
import { cfr } from "./format";

export function totalCases(rows: SurveillanceRecord[] = surveillanceData) {
  return rows.reduce((s, r) => s + r.cases, 0);
}

export function totalDeaths(rows: SurveillanceRecord[] = surveillanceData) {
  return rows.reduce((s, r) => s + r.deaths, 0);
}

export function overallCfr(rows: SurveillanceRecord[] = surveillanceData) {
  return cfr(totalDeaths(rows), totalCases(rows));
}

export function outbreaks(rows: SurveillanceRecord[] = surveillanceData) {
  return rows.filter((r) => r.status === "outbreak");
}

export function highestCfr(rows: SurveillanceRecord[] = surveillanceData, minCases = 3) {
  return rows
    .filter((r) => r.cases >= minCases)
    .map((r) => ({ row: r, pct: cfr(r.deaths, r.cases) }))
    .sort((a, b) => b.pct - a.pct)[0];
}

export function strainAggregates(): StrainAggregate[] {
  const map = new Map<string, StrainAggregate>();
  for (const r of surveillanceData) {
    const key = r.strain.replace(/ \(imported\)/i, "");
    const existing = map.get(key) ?? { name: key, cases: 0, deaths: 0, countries: 0, cfr: 0 };
    existing.cases += r.cases;
    existing.deaths += r.deaths;
    existing.countries += 1;
    map.set(key, existing);
  }
  const out = Array.from(map.values());
  out.forEach((g) => {
    g.cfr = cfr(g.deaths, g.cases);
  });
  return out.sort((a, b) => b.cases - a.cases);
}

export function regionTotals() {
  const map = new Map<string, number>();
  for (const r of surveillanceData) {
    map.set(r.region, (map.get(r.region) ?? 0) + r.cases);
  }
  return Array.from(map.entries()).map(([region, cases]) => ({ region, cases }));
}

export function regionCfr(region: string) {
  const rows = surveillanceData.filter((r) => r.region === region);
  return cfr(totalDeaths(rows), totalCases(rows));
}

export function topCountries(n = 10) {
  return [...surveillanceData].sort((a, b) => b.cases - a.cases).slice(0, n);
}

export function recentEvents(n = 5) {
  return outbreakEvents.slice(0, n);
}

export function snapshotDate() {
  const dates = surveillanceData.map((r) => r.lastReport);
  return dates.sort().pop() ?? "2026-05-08";
}
