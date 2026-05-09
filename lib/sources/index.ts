/**
 * Combined live data layer.
 *
 * Pulls from every active source in parallel and produces:
 *   - countrySnapshots: per-country numbers we can verify (currently US from CDC,
 *     plus countries listed in active WHO DON entries — count fields stay null
 *     when WHO doesn't publish per-country breakdown)
 *   - events: WHO DON entries normalized to OutbreakEvent shape
 *   - sources: per-source freshness + status
 *
 * Cached at the edge for 6h via the underlying source fetchers.
 */

import { fetchWhoEvents, type WhoEvent } from "./who";
import { fetchCdcUs, type CdcSnapshot } from "./cdc";
import type { OutbreakEvent, Region, Status } from "../types";

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
  lastReport: string;        // ISO date
  source: string;            // attribution
  sourceUrl: string;
  population?: number;
  notes?: string;
}

export interface SourceFreshness {
  source: "WHO" | "CDC";
  ok: boolean;
  fetchedAt: string;
  count: number;
  detail?: string;
}

export interface LiveData {
  countries: CountrySnapshot[];
  events: OutbreakEvent[];
  sources: SourceFreshness[];
  fetchedAt: string;
}

/**
 * Static reference: country name → ISO-2, flag, region, population. This is
 * not surveillance data — it's geographic/demographic reference, the kind of
 * thing that wouldn't change even if every disease surveillance system on
 * Earth went dark.
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

export async function fetchLive(): Promise<LiveData> {
  const fetchedAt = new Date().toISOString();
  const [whoResult, cdcResult] = await Promise.all([fetchWhoEvents(), fetchCdcUs()]);

  const countries = composeCountrySnapshots(whoResult.events, cdcResult);
  const events = whoResult.events.map(toOutbreakEvent);

  return {
    countries,
    events,
    fetchedAt,
    sources: [
      {
        source: "WHO",
        ok: whoResult.ok,
        fetchedAt: whoResult.fetchedAt,
        count: whoResult.events.length,
        detail: whoResult.ok ? `${whoResult.events.length} DON entries` : "fetch failed",
      },
      {
        source: "CDC",
        ok: cdcResult.ok,
        fetchedAt: cdcResult.fetchedAt,
        count: cdcResult.cumulativeCases ?? 0,
        detail: cdcResult.ok
          ? `${cdcResult.cumulativeCases} cumulative US cases as of end of ${cdcResult.asOfYear}`
          : "fetch failed",
      },
    ],
  };
}

function composeCountrySnapshots(whoEvents: WhoEvent[], cdc: CdcSnapshot): CountrySnapshot[] {
  const byCountry = new Map<string, CountrySnapshot>();

  // CDC: US cumulative
  if (cdc.ok && cdc.cumulativeCases != null) {
    const ref = COUNTRY_REF["United States"]!;
    byCountry.set("United States", {
      iso: ref.iso,
      country: "United States",
      flag: ref.flag,
      region: ref.region,
      cases: cdc.cumulativeCases,
      deaths: null,
      cfrPct: null,
      strain: "Sin Nombre",          // dominant US strain — reference fact
      status: "active",
      lastReport: `${cdc.asOfYear ?? new Date().getUTCFullYear()}-12-31`,
      source: `CDC (cumulative through end of ${cdc.asOfYear})`,
      sourceUrl: cdc.sourceUrl,
      population: ref.population,
      notes: "US cumulative since surveillance began in 1993",
    });
  }

  // WHO DON: countries mentioned in current events
  // We don't have per-country case counts here, but we surface that the
  // country is currently flagged in a WHO DON, which is the strongest live
  // signal there is for "this country has active hantavirus reporting".
  if (whoEvents.length > 0) {
    const latest = whoEvents[0]; // ordered desc by publication date in fetcher
    for (const name of latest.countries) {
      const ref = COUNTRY_REF[name];
      if (!ref) continue;
      // Don't overwrite the CDC US row
      if (byCountry.has(name)) continue;
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

  // Stable order: outbreak first, then cases desc, then country name
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
    source: "WHO Disease Outbreak News",
    sourceUrl: e.url,
  };
}
