/**
 * Combined live data layer.
 *
 * Active sources fanned out in parallel:
 *   - WHO Disease Outbreak News (OData API)         — events + flagged countries
 *   - CDC hantavirus cases page (HTML scrape)       — US cumulative since 1993
 *   - CDC NNDSS Weekly Tables (SODA API)            — US YTD + per-state
 *   - Wikipedia REST API                            — reference content
 *
 * Aggregates into:
 *   - countries:         CountrySnapshot[] with attribution per row
 *   - events:            OutbreakEvent[] from WHO
 *   - usWeekly:          NNDSS weekly history + per-state breakdown
 *   - sources:           per-source freshness + status
 *
 * Cached for 6h via Next fetch revalidation.
 */

import { cache } from "react";
import { fetchWhoEvents, type WhoEvent } from "./who";
import { fetchCdcUs, type CdcSnapshot } from "./cdc";
import { fetchNndss, type NndssSnapshot } from "./nndss";
import type { CaseBreakdown, OutbreakEvent, Region, Status } from "../types";

const EMPTY_BREAKDOWN: CaseBreakdown = {
  reported: null, confirmed: null, probable: null, hospitalized: null,
  critical: null, deceased: null, recovered: null,
};

export type { CaseBreakdown };

/** Per-source contribution to a row of the breakdown table. */
export interface BreakdownRow {
  source: string;
  scope: string;       // e.g. "WHO DON600 (multi-country, May 2026)" or "CDC NNDSS · US YTD 2026"
  url?: string;
  breakdown: CaseBreakdown;
}

export interface CountrySnapshot {
  iso: string;
  country: string;
  flag: string;
  region: Region;
  cases: number | null;
  deaths: number | null;
  cfrPct: number | null;
  strain: string | null;
  status: Status | null;
  lastReport: string;
  source: string;
  sourceUrl: string;
  population?: number;
  notes?: string;
}

export interface SourceFreshness {
  source: string;
  ok: boolean;
  fetchedAt: string;
  detail?: string;
  url: string;
}

export interface LiveData {
  countries: CountrySnapshot[];
  events: OutbreakEvent[];
  usWeekly: NndssSnapshot;
  sources: SourceFreshness[];
  fetchedAt: string;
  /** Aggregated case breakdown across all live sources (additive). */
  totals: CaseBreakdown;
  /** Per-source rows so the UI can show provenance instead of just one number. */
  breakdownRows: BreakdownRow[];
}

/**
 * Convert MMWR year + week → real ISO date (Sunday of that week).
 * MMWR week 1 is the first week with 4+ days in January (per CDC).
 */
function mmwrWeekToIsoDate(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Sunday = new Date(jan4.getTime() - jan4.getUTCDay() * 86_400_000);
  const target = new Date(week1Sunday.getTime() + (week - 1) * 7 * 86_400_000);
  return target.toISOString().slice(0, 10);
}

/**
 * Country reference: name → iso, flag, region, population. This is geographic
 * fact, not surveillance data.
 */
const COUNTRY_REF: Record<
  string,
  { iso: string; flag: string; region: Region; population: number }
> = {
  Argentina: { iso: "ar", flag: "🇦🇷", region: "Americas", population: 45_800_000 },
  Bolivia: { iso: "bo", flag: "🇧🇴", region: "Americas", population: 12_000_000 },
  Brazil: { iso: "br", flag: "🇧🇷", region: "Americas", population: 214_000_000 },
  Canada: { iso: "ca", flag: "🇨🇦", region: "Americas", population: 39_500_000 },
  Chile: { iso: "cl", flag: "🇨🇱", region: "Americas", population: 19_500_000 },
  Mexico: { iso: "mx", flag: "🇲🇽", region: "Americas", population: 128_000_000 },
  Paraguay: { iso: "py", flag: "🇵🇾", region: "Americas", population: 6_700_000 },
  "United States": { iso: "us", flag: "🇺🇸", region: "Americas", population: 331_000_000 },
  Uruguay: { iso: "uy", flag: "🇺🇾", region: "Americas", population: 3_400_000 },

  China: { iso: "cn", flag: "🇨🇳", region: "Asia", population: 1_410_000_000 },
  Japan: { iso: "jp", flag: "🇯🇵", region: "Asia", population: 125_700_000 },
  "South Korea": { iso: "kr", flag: "🇰🇷", region: "Asia", population: 51_800_000 },
  Russia: { iso: "ru", flag: "🇷🇺", region: "Asia", population: 144_000_000 },

  Austria: { iso: "at", flag: "🇦🇹", region: "Europe", population: 9_100_000 },
  Belgium: { iso: "be", flag: "🇧🇪", region: "Europe", population: 11_700_000 },
  Czechia: { iso: "cz", flag: "🇨🇿", region: "Europe", population: 10_700_000 },
  Denmark: { iso: "dk", flag: "🇩🇰", region: "Europe", population: 5_900_000 },
  Estonia: { iso: "ee", flag: "🇪🇪", region: "Europe", population: 1_300_000 },
  Finland: { iso: "fi", flag: "🇫🇮", region: "Europe", population: 5_550_000 },
  France: { iso: "fr", flag: "🇫🇷", region: "Europe", population: 67_900_000 },
  Germany: { iso: "de", flag: "🇩🇪", region: "Europe", population: 83_200_000 },
  Greece: { iso: "gr", flag: "🇬🇷", region: "Europe", population: 10_300_000 },
  Italy: { iso: "it", flag: "🇮🇹", region: "Europe", population: 58_900_000 },
  Netherlands: { iso: "nl", flag: "🇳🇱", region: "Europe", population: 17_500_000 },
  Norway: { iso: "no", flag: "🇳🇴", region: "Europe", population: 5_500_000 },
  Poland: { iso: "pl", flag: "🇵🇱", region: "Europe", population: 38_000_000 },
  Portugal: { iso: "pt", flag: "🇵🇹", region: "Europe", population: 10_300_000 },
  Spain: { iso: "es", flag: "🇪🇸", region: "Europe", population: 47_400_000 },
  Sweden: { iso: "se", flag: "🇸🇪", region: "Europe", population: 10_400_000 },
  Switzerland: { iso: "ch", flag: "🇨🇭", region: "Europe", population: 8_700_000 },
  "United Kingdom": { iso: "gb", flag: "🇬🇧", region: "Europe", population: 67_300_000 },

  "South Africa": { iso: "za", flag: "🇿🇦", region: "Africa", population: 60_000_000 },
  "Cabo Verde": { iso: "cv", flag: "🇨🇻", region: "Africa", population: 600_000 },
};

export const fetchLive = cache(async function fetchLive(): Promise<LiveData> {
  const fetchedAt = new Date().toISOString();
  const [whoResult, cdcResult, nndssResult] = await Promise.all([
    fetchWhoEvents(),
    fetchCdcUs(),
    fetchNndss(),
  ]);

  const countries = composeCountrySnapshots(whoResult.events, cdcResult, nndssResult);
  const events = whoResult.events.map(toOutbreakEvent);
  const breakdownRows = composeBreakdownRows(whoResult.events, nndssResult);
  const totals = sumBreakdowns(breakdownRows.map((r) => r.breakdown));

  return {
    countries,
    events,
    usWeekly: nndssResult,
    totals,
    breakdownRows,
    fetchedAt,
    sources: [
      {
        source: "WHO Disease Outbreak News",
        url: "https://www.who.int/emergencies/disease-outbreak-news",
        ok: whoResult.ok,
        fetchedAt: whoResult.fetchedAt,
        detail: whoResult.ok ? `${whoResult.events.length} hantavirus DON entries` : "fetch failed",
      },
      {
        source: "CDC Hantavirus Cases (cumulative)",
        url: cdcResult.sourceUrl,
        ok: cdcResult.ok,
        fetchedAt: cdcResult.fetchedAt,
        detail: cdcResult.ok
          ? `${cdcResult.cumulativeCases} cumulative US cases as of end of ${cdcResult.asOfYear}`
          : "fetch failed",
      },
      {
        source: "CDC NNDSS Weekly Tables",
        url: nndssResult.sourceUrl,
        ok: nndssResult.ok,
        fetchedAt: nndssResult.fetchedAt,
        detail: nndssResult.ok
          ? `${nndssResult.ytdCombined ?? 0} US cases YTD${nndssResult.reportingYear ? ` ${nndssResult.reportingYear}` : ""}` +
            (nndssResult.reportingWeek ? `, week ${nndssResult.reportingWeek}` : "") +
            ` · ${nndssResult.stateRows.length} states reporting`
          : "fetch failed",
      },
    ],
  };
});

function composeBreakdownRows(events: WhoEvent[], nndss: NndssSnapshot): BreakdownRow[] {
  const rows: BreakdownRow[] = [];

  // Most-recent WHO event represents the active outbreak. Earlier WHO events
  // (e.g. DON599 → DON600) are usually superseded by the latest, so adding
  // them would double-count.
  if (events.length > 0) {
    const e = events[0];
    rows.push({
      source: `WHO ${e.id}`,
      scope: `${e.countries.length > 1 ? "Multi-country" : (e.countries[0] ?? "Multi-country")} · ${e.publicationDate.slice(0, 10)}`,
      url: e.url,
      breakdown: e.breakdown,
    });
  }

  // CDC NNDSS — US weekly nationally notifiable surveillance, YTD.
  if (nndss.ok && nndss.ytdCombined != null) {
    rows.push({
      source: "CDC NNDSS",
      scope: `United States · YTD ${nndss.reportingYear}, week ${nndss.reportingWeek}`,
      url: nndss.sourceUrl,
      breakdown: {
        ...EMPTY_BREAKDOWN,
        reported: nndss.ytdCombined,
        confirmed: nndss.ytdCombined, // NNDSS only counts confirmed reportable cases
      },
    });
  }

  return rows;
}

function sumBreakdowns(items: CaseBreakdown[]): CaseBreakdown {
  const totals: CaseBreakdown = { ...EMPTY_BREAKDOWN };
  for (const b of items) {
    for (const k of Object.keys(totals) as Array<keyof CaseBreakdown>) {
      if (b[k] != null) totals[k] = (totals[k] ?? 0) + b[k]!;
    }
  }
  return totals;
}

function composeCountrySnapshots(
  whoEvents: WhoEvent[],
  cdc: CdcSnapshot,
  nndss: NndssSnapshot
): CountrySnapshot[] {
  const byCountry = new Map<string, CountrySnapshot>();
  const usRef = COUNTRY_REF["United States"]!;

  // 1) US row: prefer NNDSS (current YTD) when available, with CDC cumulative as a note.
  if (nndss.ok && nndss.ytdCombined != null) {
    const cumulativeNote = cdc.ok && cdc.cumulativeCases != null
      ? ` · ${cdc.cumulativeCases.toLocaleString()} cumulative since 1993 (CDC)`
      : "";
    byCountry.set("United States", {
      iso: usRef.iso,
      country: "United States",
      flag: usRef.flag,
      region: usRef.region,
      cases: nndss.ytdCombined,
      deaths: null,
      cfrPct: null,
      strain: "Sin Nombre",
      status: "active",
      lastReport: nndss.reportingYear && nndss.reportingWeek
        ? mmwrWeekToIsoDate(nndss.reportingYear, nndss.reportingWeek)
        : new Date().toISOString().slice(0, 10),
      source: `CDC NNDSS · YTD ${nndss.reportingYear} through week ${nndss.reportingWeek}`,
      sourceUrl: nndss.sourceUrl,
      population: usRef.population,
      notes: `HPS: ${nndss.ytdHps ?? 0}, non-HPS infection: ${nndss.ytdNonHps ?? 0}${cumulativeNote}`,
    });
  } else if (cdc.ok && cdc.cumulativeCases != null) {
    byCountry.set("United States", {
      iso: usRef.iso,
      country: "United States",
      flag: usRef.flag,
      region: usRef.region,
      cases: cdc.cumulativeCases,
      deaths: null,
      cfrPct: null,
      strain: "Sin Nombre",
      status: "active",
      lastReport: `${cdc.asOfYear ?? new Date().getUTCFullYear()}-12-31`,
      source: `CDC (cumulative through end of ${cdc.asOfYear})`,
      sourceUrl: cdc.sourceUrl,
      population: usRef.population,
      notes: "US cumulative since surveillance began in 1993",
    });
  }

  // 2) WHO DON: countries flagged in the latest event get a row (or status bump).
  if (whoEvents.length > 0) {
    const latest = whoEvents[0];
    for (const name of latest.countries) {
      const ref = COUNTRY_REF[name];
      if (!ref) continue;
      const existing = byCountry.get(name);
      if (existing) {
        // bump existing row to outbreak status if we already have it
        existing.status = "outbreak";
        continue;
      }
      byCountry.set(name, {
        iso: ref.iso,
        country: name,
        flag: ref.flag,
        region: ref.region,
        cases: null,
        deaths: null,
        cfrPct: null,
        strain: latest.strain,
        status: "outbreak",
        lastReport: latest.publicationDate.slice(0, 10),
        source: `WHO ${latest.id}`,
        sourceUrl: latest.url,
        population: ref.population,
        notes: "Listed in current WHO Disease Outbreak News entry",
      });
    }
  }

  return Array.from(byCountry.values()).sort((a, b) => {
    const sw = (s: Status | null) => (s === "outbreak" ? 0 : s === "active" ? 1 : 2);
    if (sw(a.status) !== sw(b.status)) return sw(a.status) - sw(b.status);
    if ((b.cases ?? -1) !== (a.cases ?? -1)) return (b.cases ?? -1) - (a.cases ?? -1);
    return a.country.localeCompare(b.country);
  });
}

function toOutbreakEvent(e: WhoEvent): OutbreakEvent {
  const primary = e.countries[0] ?? "Multi-country";
  const ref = COUNTRY_REF[primary];
  const flag = ref?.flag ?? "🌍";
  const iso = ref?.iso ?? "xx";
  const country = e.countries.length > 1 ? "Multi-country" : primary;

  return {
    id: `who-${e.id}`,
    date: e.publicationDate.slice(0, 10),
    country,
    iso,
    flag,
    severity: e.severity,
    title: e.title,
    body:
      e.summary.length > 320
        ? e.summary.slice(0, 317).trimEnd() + "…"
        : e.summary,
    breakdown: e.breakdown,
    source: "WHO Disease Outbreak News",
    sourceUrl: e.url,
  };
}
