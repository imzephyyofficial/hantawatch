/**
 * CDC NNDSS — National Notifiable Diseases Surveillance System
 *
 * SODA API: https://data.cdc.gov/resource/x9gk-5huc.json (live weekly tables)
 *
 * Two label values relevant to us:
 *   "Hantavirus pulmonary syndrome"                       — HPS
 *   "Hantavirus infection, non-hantavirus pulmonary syndrome" — non-HPS infection
 *
 * Column convention (CDC NNDSS Table I):
 *   m1 = current week
 *   m2 = previous-52-weeks median
 *   m3 = previous-52-weeks max
 *   m4 = cumulative YTD
 *
 * We pull the most-recent week's row for "U.S. Residents" + per-state rows
 * (used for per-state breakdowns on the US country page).
 */

const URL_BASE = "https://data.cdc.gov/resource/x9gk-5huc.json";

export interface NndssWeekRow {
  state: string;
  year: string;
  week: string;
  label: string;
  cumulative: number | null;
  currentWeek: number | null;
}

export interface NndssSnapshot {
  ok: boolean;
  fetchedAt: string;
  source: "CDC NNDSS";
  sourceUrl: string;
  // most-recent reported week (across both labels)
  reportingYear: number | null;
  reportingWeek: number | null;
  // current YTD totals (US Residents row)
  ytdHps: number | null;
  ytdNonHps: number | null;
  ytdCombined: number | null;
  // per-state breakdown (most-recent week, all hantavirus labels combined)
  stateRows: Array<{ state: string; cumulative: number }>;
  // last-12-week US-wide history for sparkline
  weeklyHistory: Array<{ year: number; week: number; hps: number; nonHps: number }>;
}

const empty = (fetchedAt: string, ok: boolean): NndssSnapshot => ({
  ok,
  fetchedAt,
  source: "CDC NNDSS",
  sourceUrl: "https://data.cdc.gov/Public-Health-Surveillance/Reportable-/x9gk-5huc",
  reportingYear: null,
  reportingWeek: null,
  ytdHps: null,
  ytdNonHps: null,
  ytdCombined: null,
  stateRows: [],
  weeklyHistory: [],
});

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isStateRow = (s: string): boolean => {
  const lower = s.toLowerCase();
  // exclude region/aggregate/national totals
  if (
    lower === "u.s. residents" ||
    lower === "us residents" ||
    lower === "non-us residents" ||
    lower === "non-u.s. residents" ||
    lower === "us territories" ||
    lower === "u.s. territories" ||
    lower === "total" ||
    lower.includes("new england") ||
    lower.includes("middle atlantic") ||
    lower.includes("east north central") ||
    lower.includes("west north central") ||
    lower.includes("south atlantic") ||
    lower.includes("east south central") ||
    lower.includes("west south central") ||
    lower.includes("mountain") ||
    lower.includes("pacific")
  ) {
    return false;
  }
  return true;
};

export async function fetchNndss(): Promise<NndssSnapshot> {
  const fetchedAt = new Date().toISOString();
  try {
    // 1. Most-recent US Residents rows (HPS + non-HPS), last 12 reporting weeks
    const usUrl =
      `${URL_BASE}?$where=upper(label)%20like%20%27%25HANTAVIRUS%25%27` +
      `%20AND%20upper(states)=%27U.S.%20RESIDENTS%27` +
      `&$order=year%20DESC,week%20DESC&$limit=24`;
    const usRes = await fetch(usUrl, {
      headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!usRes.ok) return empty(fetchedAt, false);
    type Row = {
      states: string;
      year: string;
      week: string;
      label: string;
      m1?: string; m2?: string; m3?: string; m4?: string;
    };
    const rows = (await usRes.json()) as Row[];
    if (rows.length === 0) return empty(fetchedAt, false);

    const latestYear = Number(rows[0].year);
    const latestWeek = Number(rows[0].week);

    // YTD totals: the m4 ("cumulative") for the most recent week, per label
    const latestRows = rows.filter((r) => Number(r.year) === latestYear && Number(r.week) === latestWeek);
    let ytdHps: number | null = null;
    let ytdNonHps: number | null = null;
    for (const r of latestRows) {
      if (/Hantavirus pulmonary syndrome/i.test(r.label)) ytdHps = num(r.m4);
      else if (/Hantavirus infection, non-hantavirus/i.test(r.label)) ytdNonHps = num(r.m4);
    }
    const ytdCombined = (ytdHps ?? 0) + (ytdNonHps ?? 0);

    // 12 most recent weeks of US-wide history (for sparkline)
    const byWeek = new Map<string, { year: number; week: number; hps: number; nonHps: number }>();
    for (const r of rows) {
      const key = `${r.year}-${r.week}`;
      const e = byWeek.get(key) ?? { year: Number(r.year), week: Number(r.week), hps: 0, nonHps: 0 };
      const v = num(r.m4) ?? 0;
      if (/Hantavirus pulmonary syndrome/i.test(r.label)) e.hps = v;
      else if (/Hantavirus infection, non-hantavirus/i.test(r.label)) e.nonHps = v;
      byWeek.set(key, e);
    }
    const weeklyHistory = Array.from(byWeek.values())
      .sort((a, b) => (a.year - b.year) * 100 + (a.week - b.week))
      .slice(-12);

    // 2. Per-state breakdown for the most recent year
    // (Limit to recent year + cumulative non-zero rows)
    const stateUrl =
      `${URL_BASE}?$where=upper(label)%20like%20%27%25HANTAVIRUS%25%27` +
      `%20AND%20year=%27${latestYear}%27` +
      `&$order=year%20DESC,week%20DESC,states%20ASC` +
      `&$limit=2000`;
    const stateRes = await fetch(stateUrl, {
      headers: { accept: "application/json", "user-agent": "HantaWatch/4" },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10000),
    });
    const allStateRows = stateRes.ok ? ((await stateRes.json()) as Row[]) : [];
    // Most-recent week for each state — cumulative (m4) per label, then aggregate
    const latestStateMap = new Map<string, { state: string; cumulative: number; week: number }>();
    for (const r of allStateRows) {
      if (!isStateRow(r.states)) continue;
      const wk = Number(r.week);
      const cum = num(r.m4);
      if (cum == null) continue;
      const stateName = titleCase(r.states.trim());
      const existing = latestStateMap.get(stateName);
      // Take the highest week's cumulative (cumulative grows with week number)
      if (!existing || wk > existing.week) {
        latestStateMap.set(stateName, { state: stateName, cumulative: cum, week: wk });
      } else if (wk === existing.week) {
        latestStateMap.set(stateName, { state: stateName, cumulative: existing.cumulative + cum, week: wk });
      }
    }
    const stateRows = Array.from(latestStateMap.values())
      .filter((s) => s.cumulative > 0)
      .map((s) => ({ state: s.state, cumulative: s.cumulative }))
      .sort((a, b) => b.cumulative - a.cumulative);

    return {
      ok: true,
      fetchedAt,
      source: "CDC NNDSS",
      sourceUrl: "https://data.cdc.gov/Public-Health-Surveillance/Reportable-/x9gk-5huc",
      reportingYear: latestYear,
      reportingWeek: latestWeek,
      ytdHps,
      ytdNonHps,
      ytdCombined: ytdCombined > 0 ? ytdCombined : null,
      stateRows,
      weeklyHistory,
    };
  } catch {
    return empty(fetchedAt, false);
  }
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|\s)\w/g, (m) => m.toUpperCase())
    .replace(/\bU\.s\./gi, "U.S.")
    .replace(/\bUs\b/g, "US");
}
