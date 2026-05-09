/**
 * Wikipedia REST API — reference content.
 *
 * Used for two things:
 *  1. Strain/disease background paragraphs (HCPS, HFRS, individual viruses)
 *  2. The historical "List of hantavirus outbreaks" article when present
 *
 * Wikipedia API docs: https://en.wikipedia.org/api/rest_v1/
 */

const REST = "https://en.wikipedia.org/api/rest_v1";

export interface WikiSummary {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
  fetchedAt: string;
  ok: boolean;
}

const empty = (title: string, fetchedAt: string): WikiSummary => ({
  title,
  extract: "",
  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  fetchedAt,
  ok: false,
});

export async function fetchWikiSummary(slug: string): Promise<WikiSummary> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(`${REST}/page/summary/${encodeURIComponent(slug)}`, {
      headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 86400 }, // 24h — Wikipedia content moves slowly
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return empty(slug, fetchedAt);
    const j = await res.json();
    return {
      title: j.title ?? slug,
      extract: j.extract ?? "",
      url: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
      thumbnail: j.thumbnail?.source,
      fetchedAt,
      ok: true,
    };
  } catch {
    return empty(slug, fetchedAt);
  }
}

/**
 * Map our internal strain names to the canonical Wikipedia article slug.
 */
export const STRAIN_WIKI_SLUG: Record<string, string> = {
  "Andes": "Andes_orthohantavirus",
  "Sin Nombre": "Sin_Nombre_orthohantavirus",
  "Hantaan": "Hantaan_orthohantavirus",
  "Puumala": "Puumala_orthohantavirus",
  "Seoul": "Seoul_orthohantavirus",
  "Laguna Negra": "Laguna_Negra_orthohantavirus",
};

/**
 * Top-of-page disease entries.
 */
export const SYNDROME_WIKI_SLUG = {
  HCPS: "Hantavirus_pulmonary_syndrome",
  HFRS: "Hemorrhagic_fever_with_renal_syndrome",
  Genus: "Orthohantavirus",
} as const;
