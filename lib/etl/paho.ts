/**
 * PAHO adapter.
 *
 * PAHO publishes country-level hantavirus surveillance under the Americas
 * regional surveillance topic:
 *   - https://www.paho.org/en/topics/hantavirus
 *
 * They also issue Epidemiological Alerts which behave like the WHO DON
 * but for the Americas. Phase 2: parse both the topic page and the
 * EpiAlerts feed.
 */

import type { Adapter } from "./types";

export const fetchPaho: Adapter = async () => {
  return { records: [], events: [], fetchedAt: new Date().toISOString() };
};
