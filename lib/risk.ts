import type { CountrySnapshot } from "./sources";
import { cfr } from "./format";

export interface RiskScore {
  iso: string;
  country: string;
  flag: string;
  region: string;
  score: number;
  drivers: { cases: number; cfr: number; perCapita: number; recency: number };
  tier: "low" | "moderate" | "elevated" | "high";
}

function recencyScore(lastReportIso: string) {
  const days =
    (Date.now() - new Date(lastReportIso + "T00:00:00Z").getTime()) /
    (1000 * 60 * 60 * 24);
  return Math.max(0, 100 - days * 0.5);
}

export function riskScore(rows: CountrySnapshot[], r: CountrySnapshot): RiskScore {
  const allCases = rows.map((x) => x.cases ?? 0).filter((c) => c > 0);
  const maxCases = Math.max(1, ...allCases);
  const casesScore = r.cases != null && r.cases > 0
    ? (Math.log10(r.cases + 1) / Math.log10(maxCases + 1)) * 100
    : (r.status === "outbreak" ? 60 : 0);

  const cfrPct = r.cases != null && r.deaths != null ? (cfr(r.deaths, r.cases) ?? 0) : 0;
  const cfrPart = Math.min(100, (cfrPct / 50) * 100);

  const perMillion =
    r.population && r.cases != null ? (r.cases / r.population) * 1_000_000 : 0;
  const perCapitaPart = Math.min(100, Math.log10(perMillion + 1) * 25);

  const rec = recencyScore(r.lastReport);

  // Status weight: an outbreak gets a floor.
  const statusFloor = r.status === "outbreak" ? 35 : r.status === "active" ? 15 : 5;

  const composite =
    casesScore * 0.2 + cfrPart * 0.25 + perCapitaPart * 0.15 + rec * 0.2 + statusFloor;
  const score = Math.min(100, Math.max(0, Math.round(composite)));

  const tier: RiskScore["tier"] =
    score >= 70 ? "high" : score >= 50 ? "elevated" : score >= 30 ? "moderate" : "low";

  return {
    iso: r.iso,
    country: r.country,
    flag: r.flag,
    region: r.region,
    score,
    tier,
    drivers: {
      cases: Math.round(casesScore),
      cfr: Math.round(cfrPart),
      perCapita: Math.round(perCapitaPart),
      recency: Math.round(rec),
    },
  };
}

export function allRiskScores(rows: CountrySnapshot[]): RiskScore[] {
  return rows.map((r) => riskScore(rows, r)).sort((a, b) => b.score - a.score);
}
