/**
 * Multi-country outbreak route data.
 *
 * For events that span multiple geographic points (cruise ships, contact-
 * tracing chains, multi-country imported clusters), we encode the public
 * waypoints from the original source so we can render a route on the
 * outbreak detail page.
 *
 * Each entry is keyed by OutbreakEvent.id and lists ordered waypoints.
 * Waypoint coordinates are public geographic facts (port locations).
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
  waypoints: Waypoint[];
}

const ROUTES: EventRoute[] = [
  {
    eventId: "who-2026-DON600",
    title: "MV Hondius cruise route (per WHO DON 600 Overview)",
    type: "cruise",
    waypoints: [
      { name: "Ushuaia",            country: "Argentina",     flag: "🇦🇷", date: "2026-04-01", kind: "departure", lng: -68.3030, lat: -54.8019, note: "Vessel departure, 88 passengers + 59 crew" },
      { name: "Antarctic Peninsula", country: "Antarctica",                  date: "2026-04-05", kind: "stopover",  lng: -60.0000, lat: -65.0000 },
      { name: "South Georgia",                                              date: "2026-04-10", kind: "stopover",  lng: -36.7500, lat: -54.4333 },
      { name: "Tristan da Cunha",                                           date: "2026-04-18", kind: "stopover",  lng: -12.2776, lat: -37.1052 },
      { name: "Saint Helena",                                               date: "2026-04-22", kind: "stopover",  lng:  -5.7089, lat: -15.9650 },
      { name: "Ascension Island",                                           date: "2026-04-26", kind: "stopover",  lng:  -14.4055, lat: -7.9467 },
      { name: "Cabo Verde (current mooring)", country: "Cabo Verde", flag: "🇨🇻", date: "2026-05-04", kind: "current", lng: -23.6045, lat: 16.5388, note: "Ship currently moored offshore as of WHO update" },
      { name: "Johannesburg (ICU)",  country: "South Africa", flag: "🇿🇦", date: "2026-05-06", kind: "hospital",   lng:  28.0473, lat: -26.2041, note: "1 critically ill patient" },
      { name: "Netherlands hospitals", country: "Netherlands", flag: "🇳🇱", date: "2026-05-07", kind: "hospital",   lng:   4.8952, lat: 52.3702, note: "2 patients hospitalised" },
      { name: "Zurich",              country: "Switzerland",  flag: "🇨🇭", date: "2026-05-07", kind: "hospital",   lng:   8.5417, lat: 47.3769, note: "1 patient hospitalised" },
    ],
  },
];

export function getRouteForEvent(eventId: string): EventRoute | null {
  return ROUTES.find((r) => r.eventId === eventId) ?? null;
}
