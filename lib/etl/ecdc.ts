/**
 * ECDC adapter.
 *
 * ECDC publishes annual hantavirus epi reports as PDF + HTML.
 *   - https://www.ecdc.europa.eu/en/hantavirus-infection
 *
 * Phase 2: scrape the HTML version where present; fall back to manual
 * upload of PDF-extracted CSVs into a `data/ecdc-overrides.csv` file.
 */

import type { Adapter } from "./types";

export const fetchEcdc: Adapter = async () => {
  return { records: [], events: [], fetchedAt: new Date().toISOString() };
};
