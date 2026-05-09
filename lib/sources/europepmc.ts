/**
 * EuropePMC — biomedical literature search.
 *
 * Public REST API. Returns peer-reviewed papers, preprints, and citations
 * matching a query. Used to track scientific activity around hantavirus.
 *
 * Docs: https://europepmc.org/RestfulWebService
 */

const API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

export interface PublicationSignal {
  totalHits: number;          // overall papers matching "hantavirus"
  recentCount: number;        // last 90 days
  recentPapers: Array<{
    id: string;               // pmid:XXXX or PMC:XXXX
    title: string;
    authors: string;
    year: number;
    journal: string;
    url: string;
  }>;
  fetchedAt: string;
  ok: boolean;
  source: "EuropePMC";
  sourceUrl: string;
}

const empty = (fetchedAt: string, ok: boolean): PublicationSignal => ({
  totalHits: 0,
  recentCount: 0,
  recentPapers: [],
  fetchedAt,
  ok,
  source: "EuropePMC",
  sourceUrl: "https://europepmc.org/search?query=hantavirus",
});

interface EuropePmcItem {
  id?: string;
  pmid?: string;
  pmcid?: string;
  title?: string;
  authorString?: string;
  pubYear?: string;
  journalTitle?: string;
  source?: string;
  doi?: string;
}

export async function fetchEuropePmc(): Promise<PublicationSignal> {
  const fetchedAt = new Date().toISOString();
  try {
    // Total + 10 most recent
    const recentUrl = `${API}?query=${encodeURIComponent("hantavirus")}&format=json&pageSize=10&resultType=lite&sort=FIRST_PDATE_D%20desc`;
    const r = await fetch(recentUrl, {
      headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return empty(fetchedAt, false);
    const data = (await r.json()) as { hitCount?: number; resultList?: { result?: EuropePmcItem[] } };
    const items = data.resultList?.result ?? [];

    // Recent = published this calendar year (lite proxy for "last 90 days" without an extra round-trip)
    const thisYear = new Date().getUTCFullYear();
    const recentCount = items.filter((p) => Number(p.pubYear) >= thisYear).length;

    return {
      totalHits: data.hitCount ?? 0,
      recentCount,
      recentPapers: items.slice(0, 6).map(toPaper),
      fetchedAt,
      ok: true,
      source: "EuropePMC",
      sourceUrl: "https://europepmc.org/search?query=hantavirus",
    };
  } catch {
    return empty(fetchedAt, false);
  }
}

function toPaper(p: EuropePmcItem) {
  const id = p.pmid ? `pmid:${p.pmid}` : p.pmcid ? `pmc:${p.pmcid}` : (p.id ?? "");
  const url = p.pmid
    ? `https://europepmc.org/article/MED/${p.pmid}`
    : p.pmcid
    ? `https://europepmc.org/article/PMC/${p.pmcid}`
    : "https://europepmc.org/search?query=hantavirus";
  return {
    id,
    title: (p.title ?? "Untitled").replace(/\s+/g, " ").trim(),
    authors: (p.authorString ?? "").replace(/\s+/g, " ").slice(0, 200),
    year: Number(p.pubYear ?? 0),
    journal: p.journalTitle ?? p.source ?? "",
    url,
  };
}
