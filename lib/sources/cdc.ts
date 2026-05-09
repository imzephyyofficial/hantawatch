/**
 * CDC Hantavirus surveillance — public HTML page.
 *
 * Source: https://www.cdc.gov/hantavirus/data-research/cases/index.html
 *
 * The page text follows a stable shape:
 *   "As of the end of YYYY, NNN cases of hantavirus disease were reported
 *    in the United States since surveillance began in 1993."
 *
 * We pull that count + the as-of year, plus the page's last-updated date.
 */

const URL_CASES = "https://www.cdc.gov/hantavirus/data-research/cases/index.html";

export interface CdcSnapshot {
  cumulativeCases: number | null;
  asOfYear: number | null;
  lastUpdated: string | null;   // free-text page header date
  source: "CDC";
  sourceUrl: string;
  fetchedAt: string;
  ok: boolean;
}

export async function fetchCdcUs(): Promise<CdcSnapshot> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(URL_CASES, {
      headers: { "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return base(fetchedAt, false);
    const html = await res.text();
    const text = strip(html);

    const m = text.match(/end of\s+(\d{4})\s*,\s*(\d{1,4})\s+cases\s+of\s+hantavirus\s+disease/i);
    const cumulativeCases = m ? Number(m[2]) : null;
    const asOfYear = m ? Number(m[1]) : null;

    const updated = text.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2},?\s+\d{4})\b/);

    return {
      cumulativeCases,
      asOfYear,
      lastUpdated: updated ? updated[1] : null,
      source: "CDC",
      sourceUrl: URL_CASES,
      fetchedAt,
      ok: cumulativeCases != null,
    };
  } catch {
    return base(fetchedAt, false);
  }
}

function base(fetchedAt: string, ok: boolean): CdcSnapshot {
  return {
    cumulativeCases: null,
    asOfYear: null,
    lastUpdated: null,
    source: "CDC",
    sourceUrl: URL_CASES,
    fetchedAt,
    ok,
  };
}

function strip(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
