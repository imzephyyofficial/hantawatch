import type { OutbreakEvent, Severity } from "./types";

/**
 * Fetch real hantavirus signals from public sources.
 *
 * Currently active:
 *   - WHO Disease Outbreak News (JSON OData API), filtered for hantavirus
 *
 * Cached at the edge for 6h via Next.js native fetch caching.
 * Returns [] on any error so the UI degrades gracefully to curated data.
 */

interface WhoDonItem {
  Id: string;
  PublicationDate: string;
  UrlName?: string;
  ItemDefaultUrl?: string;
  Response?: string;
  Title?: string;
}

const COUNTRY_TO_FLAG: Record<string, string> = {
  Argentina: "🇦🇷", Chile: "🇨🇱", "United States": "🇺🇸", "United States of America": "🇺🇸", USA: "🇺🇸",
  Brazil: "🇧🇷", Bolivia: "🇧🇴", Paraguay: "🇵🇾", Mexico: "🇲🇽", Canada: "🇨🇦", Peru: "🇵🇪",
  China: "🇨🇳", "South Korea": "🇰🇷", "Republic of Korea": "🇰🇷", Russia: "🇷🇺", Japan: "🇯🇵",
  "Russian Federation": "🇷🇺", Mongolia: "🇲🇳",
  Finland: "🇫🇮", Germany: "🇩🇪", Sweden: "🇸🇪", Netherlands: "🇳🇱", France: "🇫🇷",
  "United Kingdom": "🇬🇧", "United Kingdom of Great Britain and Northern Ireland": "🇬🇧", UK: "🇬🇧",
  Spain: "🇪🇸", Portugal: "🇵🇹", Italy: "🇮🇹", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Austria: "🇦🇹", Denmark: "🇩🇰", Norway: "🇳🇴", Estonia: "🇪🇪", "Czech Republic": "🇨🇿",
  Czechia: "🇨🇿", Slovakia: "🇸🇰", Poland: "🇵🇱", Hungary: "🇭🇺", Greece: "🇬🇷",
  "South Africa": "🇿🇦", "Cabo Verde": "🇨🇻", "Cape Verde": "🇨🇻", Mozambique: "🇲🇿",
};

const COUNTRY_TO_ISO: Record<string, string> = {
  Argentina: "ar", Chile: "cl", "United States": "us", "United States of America": "us", USA: "us",
  Brazil: "br", Mexico: "mx", Canada: "ca", China: "cn",
  "South Korea": "kr", "Republic of Korea": "kr", Russia: "ru", "Russian Federation": "ru", Japan: "jp",
  Finland: "fi", Germany: "de", Sweden: "se", Netherlands: "nl", France: "fr",
  "United Kingdom": "gb", UK: "gb", Spain: "es", Italy: "it",
  Switzerland: "ch", "South Africa": "za", "Cabo Verde": "cv", "Cape Verde": "cv",
};

const WHO_API =
  "https://www.who.int/api/news/diseaseoutbreaknews" +
  "?$filter=contains(Title,%27antavirus%27)" +
  "&$orderby=PublicationDate%20desc" +
  "&$top=12";

export interface LiveFetchResult {
  events: OutbreakEvent[];
  fetchedAt: string;
  ok: boolean;
  source: "WHO";
}

export async function fetchWhoLive(): Promise<LiveFetchResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(WHO_API, {
      headers: {
        accept: "application/json",
        "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)",
      },
      next: { revalidate: 21600 }, // 6h
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { events: [], fetchedAt, ok: false, source: "WHO" };
    const data = (await res.json()) as { value?: WhoDonItem[] };
    const items = (data.value ?? [])
      .filter((it) => Boolean(it.Title) && Boolean(it.PublicationDate))
      .filter((it) => !/^1\d{3}/.test(String(it.UrlName ?? ""))) // skip historical archive entries
      .slice(0, 8)
      .map(toEvent);
    return { events: items, fetchedAt, ok: true, source: "WHO" };
  } catch {
    return { events: [], fetchedAt, ok: false, source: "WHO" };
  }
}

function toEvent(item: WhoDonItem): OutbreakEvent {
  const country = extractCountry(item.Title ?? "");
  const iso = COUNTRY_TO_ISO[country] ?? "xx";
  const flag = COUNTRY_TO_FLAG[country] ?? "🌍";
  const fullBody = stripHtml(item.Response ?? "");
  return {
    id: `who-${item.UrlName ?? item.Id}`,
    date: item.PublicationDate.slice(0, 10),
    country,
    iso,
    flag,
    severity: detectSeverity(item.Title ?? ""),
    title: cleanText(item.Title ?? "WHO outbreak notification"),
    body: fullBody.length > 320 ? fullBody.slice(0, 317).trimEnd() + "…" : fullBody,
    source: "WHO Disease Outbreak News",
    sourceUrl: item.ItemDefaultUrl
      ? `https://www.who.int${item.ItemDefaultUrl}`
      : "https://www.who.int/emergencies/disease-outbreak-news",
  };
}

function extractCountry(title: string): string {
  if (/multi.?country/i.test(title)) return "Multi-country";
  // patterns like "Hantavirus - Argentina" or "Hantavirus — Multi-country"
  const dash = title.split(/[—–\-]\s*/);
  const last = dash[dash.length - 1].trim();
  return last || "Multi-country";
}

function detectSeverity(title: string): Severity {
  if (/multi.?country|cluster|outbreak/i.test(title)) return "high";
  return "medium";
}

function cleanText(s: string): string {
  return s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "—")
    .replace(/&mdash;/g, "—")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
