import type { CountrySnapshot } from "./sources";
import type { StrainAggregate } from "./types";
import { cfr } from "./format";

export function totalCases(rows: CountrySnapshot[]) {
  return rows.reduce((s, r) => s + (r.cases ?? 0), 0);
}

export function totalDeaths(rows: CountrySnapshot[]) {
  return rows.reduce((s, r) => s + (r.deaths ?? 0), 0);
}

export function overallCfr(rows: CountrySnapshot[]) {
  const c = totalCases(rows);
  const d = totalDeaths(rows);
  return cfr(d, c);
}

export function outbreakRows(rows: CountrySnapshot[]) {
  return rows.filter((r) => r.status === "outbreak");
}

export function highestCfr(rows: CountrySnapshot[], minCases = 3) {
  return rows
    .filter((r) => r.cases != null && r.cases >= minCases && r.deaths != null)
    .map((r) => ({ row: r, pct: cfr(r.deaths!, r.cases!) }))
    .sort((a, b) => b.pct - a.pct)[0];
}

export function strainAggregates(rows: CountrySnapshot[]): StrainAggregate[] {
  const map = new Map<string, StrainAggregate>();
  for (const r of rows) {
    const name = (r.strain ?? "Unspecified").replace(/ \(imported\)/i, "");
    const existing = map.get(name) ?? { name, cases: 0, deaths: 0, countries: 0, cfr: 0 };
    existing.cases += r.cases ?? 0;
    existing.deaths += r.deaths ?? 0;
    existing.countries += 1;
    map.set(name, existing);
  }
  const out = Array.from(map.values());
  out.forEach((g) => {
    g.cfr = cfr(g.deaths, g.cases);
  });
  return out.sort((a, b) => b.cases - a.cases);
}

export function regionTotals(rows: CountrySnapshot[]) {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.region, (map.get(r.region) ?? 0) + (r.cases ?? 0));
  }
  return Array.from(map.entries()).map(([region, cases]) => ({ region, cases }));
}

export function regionCfr(rows: CountrySnapshot[], region: string) {
  const sub = rows.filter((r) => r.region === region);
  return overallCfr(sub);
}

export function topCountries(rows: CountrySnapshot[], n = 10) {
  return rows
    .filter((r) => r.cases != null && r.cases > 0)
    .sort((a, b) => (b.cases ?? 0) - (a.cases ?? 0))
    .slice(0, n)
    .map((r) => ({ country: r.country, flag: r.flag, cases: r.cases ?? 0 }));
}

export function snapshotDate(rows: CountrySnapshot[]) {
  if (rows.length === 0) return new Date().toISOString().slice(0, 10);
  return rows.map((r) => r.lastReport).sort().pop()!;
}
