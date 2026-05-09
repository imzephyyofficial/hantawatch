/**
 * WHO Disease Outbreak News adapter.
 *
 * The DON RSS feed lists every WHO outbreak notification. We filter for
 * hantavirus-related entries and normalize. WHO's RSS structure:
 *   https://www.who.int/rss-feeds/disease-outbreak-news-english.xml
 *
 * This adapter is currently a stub — wire up XML parsing (`fast-xml-parser`)
 * in Phase 2 once Neon is connected. Until then, returning an empty result
 * keeps the cron route safe.
 */

import type { Adapter } from "./types";

export const fetchWho: Adapter = async () => {
  // Real implementation (commented until Phase 2 launch):
  //
  //   const xml = await fetch("https://www.who.int/rss-feeds/disease-outbreak-news-english.xml").then(r => r.text());
  //   const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
  //   const items = parsed?.rss?.channel?.item ?? [];
  //   const events = items
  //     .filter((it: any) => /hantavirus|HCPS|HFRS/i.test(it.title + " " + it.description))
  //     .map((it: any): NormalizedEvent => ({ ... }));
  //
  return { records: [], events: [], fetchedAt: new Date().toISOString() };
};
