/**
 * CDC adapter.
 *
 * CDC publishes a small set of authoritative figures:
 *   - https://www.cdc.gov/hantavirus/surveillance/index.html (annual case table)
 *   - https://www.cdc.gov/mmwr/  (MMWR weekly reports)
 *
 * Neither has a clean API. The HTML table on the surveillance page is
 * stable enough to scrape with a CSS selector. MMWR often requires PDF
 * parsing for the latest weeks; we skip those in v1 and rely on the table.
 *
 * Phase 2: implement scraping with `cheerio`. Stub returns empty.
 */

import type { Adapter } from "./types";

export const fetchCdc: Adapter = async () => {
  return { records: [], events: [], fetchedAt: new Date().toISOString() };
};
