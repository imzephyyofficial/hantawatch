/**
 * Country + US-state centroids for map markers. Sourced from public datasets
 * (Wikipedia geographic centers / Natural Earth admin centroids); these are
 * approximate single points per region — fine for a marker layer, not for
 * drawing borders.
 */

export const COUNTRY_CENTROID: Record<string, [number, number]> = {
  // Americas
  ar: [-63.6167, -38.4161],   // Argentina
  bo: [-63.5887, -16.2902],
  br: [-51.9253, -14.2350],
  ca: [-106.3468, 56.1304],
  cl: [-71.5430, -35.6751],
  co: [-74.2973, 4.5709],
  ec: [-78.1834, -1.8312],
  mx: [-102.5528, 23.6345],
  pa: [-80.7821, 8.5380],
  py: [-58.4438, -23.4425],
  pe: [-75.0152, -9.1900],
  us: [-95.7129, 37.0902],
  uy: [-55.7658, -32.5228],
  ve: [-66.5897, 6.4238],
  // Europe
  at: [14.5501, 47.5162],
  be: [4.4699, 50.5039],
  ch: [8.2275, 46.8182],
  cz: [15.4729, 49.8175],
  de: [10.4515, 51.1657],
  dk: [9.5018, 56.2639],
  ee: [25.0136, 58.5953],
  es: [-3.7492, 40.4637],
  fi: [25.7482, 61.9241],
  fr: [2.2137, 46.2276],
  gb: [-3.4360, 55.3781],
  gr: [21.8243, 39.0742],
  hu: [19.5033, 47.1625],
  ie: [-8.2439, 53.4129],
  is: [-19.0208, 64.9631],
  it: [12.5674, 41.8719],
  lt: [23.8813, 55.1694],
  lv: [24.6032, 56.8796],
  nl: [5.2913, 52.1326],
  no: [8.4689, 60.4720],
  pl: [19.1451, 51.9194],
  pt: [-8.2245, 39.3999],
  ro: [24.9668, 45.9432],
  ru: [105.3188, 61.5240],
  se: [18.6435, 60.1282],
  // Asia
  cn: [104.1954, 35.8617],
  in: [78.9629, 20.5937],
  jp: [138.2529, 36.2048],
  kr: [127.7669, 35.9078],
  kz: [66.9237, 48.0196],
  mn: [103.8467, 46.8625],
  // Africa + Oceania
  au: [133.7751, -25.2744],
  cv: [-23.6045, 16.5388],   // Cabo Verde
  za: [22.9375, -30.5595],
  // Default fallback
  xx: [0, 0],
};

/**
 * US state centroids — for placing NNDSS per-state markers on the map.
 * Approximate centroids; sourced from Census Bureau geographic centers.
 */
export const US_STATE_CENTROID: Record<string, [number, number]> = {
  alabama: [-86.79113, 32.806671],
  alaska: [-152.404419, 61.370716],
  arizona: [-111.431221, 33.729759],
  arkansas: [-92.373123, 34.969704],
  california: [-119.681564, 36.116203],
  colorado: [-105.311104, 39.059811],
  connecticut: [-72.755371, 41.597782],
  delaware: [-75.507141, 39.318523],
  florida: [-81.686783, 27.766279],
  georgia: [-83.643074, 33.040619],
  hawaii: [-157.498337, 21.094318],
  idaho: [-114.478828, 44.240459],
  illinois: [-88.986137, 40.349457],
  indiana: [-86.258278, 39.849426],
  iowa: [-93.210526, 42.011539],
  kansas: [-96.726486, 38.5266],
  kentucky: [-84.670067, 37.66814],
  louisiana: [-91.867805, 31.169546],
  maine: [-69.381927, 44.693947],
  maryland: [-76.802101, 39.063946],
  massachusetts: [-71.530106, 42.230171],
  michigan: [-84.536095, 43.326618],
  minnesota: [-93.900192, 45.694454],
  mississippi: [-89.678696, 32.741646],
  missouri: [-92.288368, 38.456085],
  montana: [-110.454353, 46.921925],
  nebraska: [-98.268082, 41.12537],
  nevada: [-117.055374, 38.313515],
  "new hampshire": [-71.563896, 43.452492],
  "new jersey": [-74.521011, 40.298904],
  "new mexico": [-106.248482, 34.840515],
  "new york": [-74.948051, 42.165726],
  "north carolina": [-79.806419, 35.630066],
  "north dakota": [-99.784012, 47.528912],
  ohio: [-82.764915, 40.388783],
  oklahoma: [-96.928917, 35.565342],
  oregon: [-122.070938, 44.572021],
  pennsylvania: [-77.209755, 40.590752],
  "rhode island": [-71.51178, 41.680893],
  "south carolina": [-80.945007, 33.856892],
  "south dakota": [-99.438828, 44.299782],
  tennessee: [-86.692345, 35.747845],
  texas: [-97.563461, 31.054487],
  utah: [-111.862434, 40.150032],
  vermont: [-72.710686, 44.045876],
  virginia: [-78.169968, 37.769337],
  washington: [-121.490494, 47.400902],
  "west virginia": [-80.954453, 38.491226],
  wisconsin: [-89.616508, 44.268543],
  wyoming: [-107.30249, 42.755966],
};

export function stateCentroid(stateName: string): [number, number] | null {
  const k = stateName.toLowerCase().replace(/^u\.s\.\s+/, "");
  return US_STATE_CENTROID[k] ?? null;
}
