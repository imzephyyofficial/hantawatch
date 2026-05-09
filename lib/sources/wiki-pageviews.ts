/**
 * Wikipedia pageviews — public-interest tracker.
 *
 * Wikimedia REST API returns daily pageview counts for any article. We pull
 * the last 60 days for the canonical hantavirus pages — useful as a proxy
 * for public attention spikes (correlates with news coverage).
 *
 * Docs: https://wikimedia.org/api/rest_v1/#/Pageviews_data
 */

const REST = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents";

export interface PageviewSignal {
  series: Array<{ article: string; daily: Array<{ date: string; views: number }> }>;
  totalLast30d: number;
  totalLast7d: number;
  fetchedAt: string;
  ok: boolean;
  source: "Wikipedia pageviews";
  sourceUrl: string;
}

const ARTICLES = [
  "Orthohantavirus",
  "Hantavirus_pulmonary_syndrome",
  "Hemorrhagic_fever_with_renal_syndrome",
];

const empty = (fetchedAt: string, ok: boolean): PageviewSignal => ({
  series: [],
  totalLast30d: 0,
  totalLast7d: 0,
  fetchedAt,
  ok,
  source: "Wikipedia pageviews",
  sourceUrl: "https://pageviews.wmcloud.org/?project=en.wikipedia.org&platform=all-access&pages=Orthohantavirus",
});

interface PageviewItem { timestamp: string; views: number; }

function ymd(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function fetchOne(article: string, start: string, end: string) {
  const r = await fetch(`${REST}/${encodeURIComponent(article)}/daily/${start}/${end}`, {
    headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return [] as PageviewItem[];
  const data = (await r.json()) as { items?: PageviewItem[] };
  return data.items ?? [];
}

export async function fetchWikiPageviews(): Promise<PageviewSignal> {
  const fetchedAt = new Date().toISOString();
  try {
    const today = new Date();
    const start = ymd(new Date(today.getTime() - 60 * 86_400_000));
    const end = ymd(today);

    const results = await Promise.all(ARTICLES.map((a) => fetchOne(a, start, end)));
    const series = ARTICLES.map((article, i) => ({
      article,
      daily: results[i].map((d) => ({
        date: `${d.timestamp.slice(0, 4)}-${d.timestamp.slice(4, 6)}-${d.timestamp.slice(6, 8)}`,
        views: d.views,
      })),
    }));

    // Aggregate across all articles
    const allDays = new Map<string, number>();
    for (const s of series) {
      for (const d of s.daily) {
        allDays.set(d.date, (allDays.get(d.date) ?? 0) + d.views);
      }
    }
    const sorted = Array.from(allDays.entries()).sort();
    const last30 = sorted.slice(-30).reduce((s, [, v]) => s + v, 0);
    const last7 = sorted.slice(-7).reduce((s, [, v]) => s + v, 0);

    return {
      series,
      totalLast30d: last30,
      totalLast7d: last7,
      fetchedAt,
      ok: series.some((s) => s.daily.length > 0),
      source: "Wikipedia pageviews",
      sourceUrl: "https://pageviews.wmcloud.org/?project=en.wikipedia.org&platform=all-access&pages=Orthohantavirus",
    };
  } catch {
    return empty(fetchedAt, false);
  }
}
