/**
 * Multi-country outbreak route data.
 *
 * For events that span multiple geographic points (cruise ships, contact-
 * tracing chains, multi-country imported clusters), we encode the public
 * waypoints with citations to their original source so the route map on
 * an outbreak detail page is fully verifiable.
 *
 * Waypoint coordinates are public geographic facts (port locations);
 * dates and roles come from the linked WHO DON Overview / Response
 * sections.
 */

export type WaypointKind = "departure" | "stopover" | "current" | "hospital" | "evacuation";

export interface Waypoint {
  name: string;
  country?: string;
  flag?: string;
  date?: string;            // ISO if known
  kind: WaypointKind;
  lng: number;
  lat: number;
  note?: string;
}

export interface EventRoute {
  eventId: string;
  title: string;
  type: "cruise" | "flight" | "contact" | "import";
  /** Where each waypoint comes from. Surfaced on the page so users can verify. */
  citation: { source: string; url: string; section: string };
  waypoints: Waypoint[];
}

const ROUTES: EventRoute[] = [
  {
    eventId: "who-2026-DON600",
    title: "MV Hondius cruise route",
    type: "cruise",
    citation: {
      source: "WHO Disease Outbreak News 600",
      url: "https://www.who.int/2026-DON600",
      section: "Overview / Description of the event",
    },
    waypoints: [
      { name: "Ushuaia",            country: "Argentina",     flag: "🇦🇷", date: "2026-04-01", kind: "departure", lng: -68.3030, lat: -54.8019, note: "Vessel departure per WHO DON 600 Overview; 88 passengers + 59 crew." },
      { name: "Antarctic Peninsula", country: "Antarctica",                  date: "2026-04-05", kind: "stopover",  lng: -60.0000, lat: -65.0000, note: "Itinerary stop named in WHO DON 600 Overview." },
      { name: "South Georgia",                                              date: "2026-04-10", kind: "stopover",  lng: -36.7500, lat: -54.4333, note: "Itinerary stop named in WHO DON 600 Overview." },
      { name: "Tristan da Cunha",                                           date: "2026-04-18", kind: "stopover",  lng: -12.2776, lat: -37.1052, note: "Itinerary stop named in WHO DON 600 Overview." },
      { name: "Saint Helena",                                               date: "2026-04-22", kind: "stopover",  lng:  -5.7089, lat: -15.9650, note: "Disembarkation point flagged for contact tracing per WHO DON 600." },
      { name: "Ascension Island",                                           date: "2026-04-26", kind: "stopover",  lng:  -14.4055, lat: -7.9467, note: "Itinerary stop named in WHO DON 600 Overview." },
      { name: "Cabo Verde (current mooring)", country: "Cabo Verde", flag: "🇨🇻", date: "2026-05-04", kind: "current", lng: -23.6045, lat: 16.5388, note: "Vessel currently moored offshore per WHO DON 600 Overview." },
      { name: "Johannesburg (ICU)",  country: "South Africa", flag: "🇿🇦", date: "2026-05-06", kind: "hospital",   lng:  28.0473, lat: -26.2041, note: "1 critically ill case in intensive care per WHO DON 600 Overview." },
      { name: "Netherlands hospitals", country: "Netherlands", flag: "🇳🇱", date: "2026-05-07", kind: "hospital",   lng:   4.8952, lat: 52.3702, note: "2 patients hospitalised in different facilities per WHO DON 600 Overview." },
      { name: "Zurich",              country: "Switzerland",  flag: "🇨🇭", date: "2026-05-07", kind: "hospital",   lng:   8.5417, lat: 47.3769, note: "1 patient hospitalised per WHO DON 600 Overview." },
    ],
  },
];

export function getRouteForEvent(eventId: string): EventRoute | null {
  return ROUTES.find((r) => r.eventId === eventId) ?? null;
}
