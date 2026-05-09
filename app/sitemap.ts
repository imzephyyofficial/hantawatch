import type { MetadataRoute } from "next";
import { surveillanceData, outbreakEvents, strains } from "@/lib/data";

const BASE = "https://hantawatch-global.vercel.app";
const slug = (s: string) => s.toLowerCase().replace(/[ /]/g, "-");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const main = ["", "/surveillance", "/outbreaks", "/analytics", "/reports", "/status"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1.0 : 0.8,
  }));
  const countries = surveillanceData.map((r) => ({
    url: `${BASE}/country/${r.iso}`,
    lastModified: new Date(r.lastReport),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const events = outbreakEvents.map((e) => ({
    url: `${BASE}/outbreaks/${e.id}`,
    lastModified: new Date(e.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const strainPages = strains.map((s) => ({
    url: `${BASE}/strain/${slug(s.name)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...main, ...countries, ...events, ...strainPages];
}
