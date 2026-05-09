/**
 * Daily cron — fetches every live source, then revalidates the pages that
 * depend on it so subsequent visitors get fresh data.
 *
 * Without a database, the cron's job is to bust the Next.js fetch cache so
 * the next request re-hits WHO + CDC. Once Phase 2 (Neon) lands, this also
 * persists snapshots and a per-source fetch_log.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchLive } from "@/lib/sources";
import { isDbReady } from "@/lib/db/client";

export const maxDuration = 60;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const started = new Date().toISOString();
  const live = await fetchLive();

  // Revalidate every page that depends on live data
  const paths = [
    "/", "/surveillance", "/outbreaks", "/risk", "/compare", "/analytics",
    "/reports", "/status", "/sitemap.xml",
    "/api/v1/countries", "/api/v1/outbreaks", "/api/v1/strains", "/api/v1/metrics",
    "/api/rss/outbreaks",
  ];
  for (const p of paths) revalidatePath(p);

  return NextResponse.json({
    ok: true,
    db: isDbReady ? "connected" : "not provisioned",
    started,
    finished: new Date().toISOString(),
    sources: live.sources,
    countries: live.countries.length,
    events: live.events.length,
    note: isDbReady
      ? "DB connected — WHO + CDC live; ECDC/PAHO require Phase 2 adapters"
      : "Live: WHO + CDC. Phase 2 (Neon) unlocks ECDC/PAHO + persistence.",
  });
}
