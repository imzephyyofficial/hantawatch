import type { MetadataRoute } from "next";
import { strains } from "@/lib/data";
import { fetchLive } from "@/lib/sources";

const BASE = "https://hantawatch-global.vercel.app";
const slug = (s: string) => s.toLowerCase().replace(/[ /]/g, "-");

export const revalidate = 21600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const main = ["", "/surveillance", "/outbreaks", "/risk", "/compare", "/analytics", "/sources", "/reports", "/status"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1.0 : 0.8,
  }));

  const { countries, events } = await fetchLive();

  const countryEntries = countries.map((r) => ({
    url: `${BASE}/country/${r.iso}`,
    lastModified: new Date(r.lastReport),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
  const eventEntries = events.map((e) => ({
    url: `${BASE}/outbreaks/${e.id}`,
    lastModified: new Date(e.date),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const strainEntries = strains.map((s) => ({
    url: `${BASE}/strain/${slug(s.name)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...main, ...countryEntries, ...eventEntries, ...strainEntries];
}
