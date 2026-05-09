import { cache } from "react";
import { fetchEuropePmc, type PublicationSignal } from "./europepmc";
import { fetchBiorxiv, type PreprintSignal } from "./biorxiv";
import { fetchWikiPageviews, type PageviewSignal } from "./wiki-pageviews";

export interface ResearchSignals {
  publications: PublicationSignal;
  preprints: PreprintSignal;
  pageviews: PageviewSignal;
  fetchedAt: string;
}

/**
 * Fan-out fetch of all research signals. Cached per-request via React cache().
 * All three sources fail open — if one upstream is down the dashboard still
 * renders with the others.
 */
export const fetchResearch = cache(async function fetchResearch(): Promise<ResearchSignals> {
  const fetchedAt = new Date().toISOString();
  const [publications, preprints, pageviews] = await Promise.all([
    fetchEuropePmc(),
    fetchBiorxiv(),
    fetchWikiPageviews(),
  ]);
  return { publications, preprints, pageviews, fetchedAt };
});
