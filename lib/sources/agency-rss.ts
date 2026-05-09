/**
 * Public-health agency RSS feeds — filtered for hantavirus mentions.
 *
 * These feeds are explicitly redistributable (CDC MMWR is US-government
 * public domain; PAHO is a WHO regional office's public communications
 * channel). We display title + publication date + source attribution and
 * link back to the original article — standard aggregation, no excerpt.
 */

const HANTA_RX = /hantavirus|orthohantavirus|HCPS|HFRS|Sin\s+Nombre|Andes\s+virus|Puumala|Hantaan|Seoul\s+virus|Laguna\s+Negra|nephropathia\s+epidemica/i;

export interface AgencyArticle {
  id: string;
  title: string;
  link: string;
  date: string;        // ISO
  source: "CDC MMWR" | "PAHO";
}

export interface AgencyFeedResult {
  source: AgencyArticle["source"];
  items: AgencyArticle[];
  totalScanned: number;
  fetchedAt: string;
  ok: boolean;
  feedUrl: string;
}

const empty = (source: AgencyArticle["source"], feedUrl: string, fetchedAt: string, ok: boolean): AgencyFeedResult =>
  ({ source, items: [], totalScanned: 0, fetchedAt, ok, feedUrl });

interface RawItem { title: string; link: string; pubDate?: string; }

function parseItems(xml: string): RawItem[] {
  const items: RawItem[] = [];
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
  for (const block of itemBlocks) {
    const t = block.match(/<title>([\s\S]*?)<\/title>/);
    const l = block.match(/<link>([\s\S]*?)<\/link>/);
    const d = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? block.match(/<dc:date>([\s\S]*?)<\/dc:date>/);
    const title = t ? decodeXmlEntities(t[1]).trim() : "";
    const link = l ? decodeXmlEntities(l[1]).trim() : "";
    const pubDate = d ? d[1].trim() : undefined;
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function toIsoDate(pubDate: string | undefined): string {
  if (!pubDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(pubDate);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

async function fetchAndFilter(
  url: string,
  source: AgencyArticle["source"],
  fetchedAt: string
): Promise<AgencyFeedResult> {
  try {
    const r = await fetch(url, {
      headers: { accept: "application/rss+xml, application/xml, text/xml", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return empty(source, url, fetchedAt, false);
    const xml = await r.text();
    const raw = parseItems(xml);
    const matches = raw.filter((it) => HANTA_RX.test(it.title));
    const items = matches.slice(0, 10).map((it, idx): AgencyArticle => ({
      id: `${source.toLowerCase().replace(/\s+/g, "-")}-${toIsoDate(it.pubDate)}-${idx}`,
      title: it.title.slice(0, 240),
      link: it.link,
      date: toIsoDate(it.pubDate),
      source,
    }));
    return { source, items, totalScanned: raw.length, fetchedAt, ok: true, feedUrl: url };
  } catch {
    return empty(source, url, fetchedAt, false);
  }
}

export async function fetchCdcMmwr(): Promise<AgencyFeedResult> {
  return fetchAndFilter("https://www.cdc.gov/mmwr/rss/mmwr.xml", "CDC MMWR", new Date().toISOString());
}

export async function fetchPahoRss(): Promise<AgencyFeedResult> {
  return fetchAndFilter("https://www.paho.org/en/rss.xml", "PAHO", new Date().toISOString());
}
