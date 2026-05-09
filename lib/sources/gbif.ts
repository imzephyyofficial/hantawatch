/**
 * GBIF — Global Biodiversity Information Facility.
 *
 * Used to enrich strain reference pages with proper taxonomy of the
 * reservoir species (the rodent that carries each hantavirus). The reservoir
 * data is what differentiates hantavirus epidemiology — knowing the host
 * is half the surveillance story.
 *
 * Docs: https://www.gbif.org/developer/species
 */

const SPECIES_API = "https://api.gbif.org/v1/species/match";
const OCCURRENCE_API = "https://api.gbif.org/v1/occurrence/search";

export interface ReservoirInfo {
  scientificName: string;
  commonName?: string;
  kingdom?: string;
  phylum?: string;
  order?: string;
  family?: string;
  genus?: string;
  speciesKey?: number;
  occurrences?: number;          // total recorded occurrences (range proxy)
  ok: boolean;
  source: "GBIF";
  url: string;
}

/**
 * Map our strain name → reservoir species scientific name.
 */
const STRAIN_RESERVOIR: Record<string, string> = {
  "Andes": "Oligoryzomys longicaudatus",
  "Sin Nombre": "Peromyscus maniculatus",
  "Hantaan": "Apodemus agrarius",
  "Puumala": "Myodes glareolus",
  "Seoul": "Rattus norvegicus",
  "Laguna Negra": "Calomys laucha",
};

interface GbifMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  kingdom?: string;
  phylum?: string;
  order?: string;
  family?: string;
  genus?: string;
}

export async function fetchReservoir(strainName: string): Promise<ReservoirInfo | null> {
  const species = STRAIN_RESERVOIR[strainName];
  if (!species) return null;
  try {
    const matchRes = await fetch(`${SPECIES_API}?name=${encodeURIComponent(species)}`, {
      headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!matchRes.ok) return null;
    const match = (await matchRes.json()) as GbifMatch;

    let occurrences: number | undefined;
    if (match.usageKey) {
      try {
        const occRes = await fetch(`${OCCURRENCE_API}?taxonKey=${match.usageKey}&limit=0`, {
          headers: { accept: "application/json" },
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(8000),
        });
        if (occRes.ok) {
          const occ = (await occRes.json()) as { count?: number };
          occurrences = occ.count;
        }
      } catch { /* occurrence fetch is bonus; ignore failures */ }
    }

    return {
      scientificName: match.scientificName ?? species,
      kingdom: match.kingdom,
      phylum: match.phylum,
      order: match.order,
      family: match.family,
      genus: match.genus,
      speciesKey: match.usageKey,
      occurrences,
      ok: true,
      source: "GBIF",
      url: match.usageKey ? `https://www.gbif.org/species/${match.usageKey}` : "https://www.gbif.org/",
    };
  } catch {
    return null;
  }
}
