import { surveillanceData } from "./data";
import type { SurveillanceRecord } from "./types";
import { cfr } from "./format";

export interface RiskScore {
  iso: string;
  country: string;
  flag: string;
  region: string;
  score: number;        // 0–100
  drivers: { cases: number; cfr: number; perCapita: number; recency: number };
  tier: "low" | "moderate" | "elevated" | "high";
}

const today = new Date("2026-05-08T00:00:00Z").getTime();

function recencyScore(iso: string) {
  const r = surveillanceData.find((x) => x.iso === iso);
  if (!r) return 0;
  const days = (today - new Date(r.lastReport + "T00:00:00Z").getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 100 - days * 5);
}

export function riskScore(r: SurveillanceRecord): RiskScore {
  // normalize each component to 0–100
  const allCases = surveillanceData.map((x) => x.cases);
  const maxCases = Math.max(...allCases);
  const casesScore = (Math.log10(r.cases + 1) / Math.log10(maxCases + 1)) * 100;

  const cfrPct = cfr(r.deaths, r.cases);
  const cfrScore = Math.min(100, (cfrPct / 50) * 100); // cap at 50% CFR

  const perMillion = r.population ? (r.cases / r.population) * 1_000_000 : 0;
  const perCapitaScore = Math.min(100, Math.log10(perMillion + 1) * 25);

  const recScore = recencyScore(r.iso);

  // weighted composite
  const score =
    casesScore * 0.25 +
    cfrScore * 0.35 +
    perCapitaScore * 0.2 +
    recScore * 0.2;

  const tier: RiskScore["tier"] = score >= 70 ? "high" : score >= 50 ? "elevated" : score >= 30 ? "moderate" : "low";

  return {
    iso: r.iso,
    country: r.country,
    flag: r.flag,
    region: r.region,
    score: Math.round(score),
    tier,
    drivers: {
      cases: Math.round(casesScore),
      cfr: Math.round(cfrScore),
      perCapita: Math.round(perCapitaScore),
      recency: Math.round(recScore),
    },
  };
}

export function allRiskScores(): RiskScore[] {
  return surveillanceData.map(riskScore).sort((a, b) => b.score - a.score);
}
