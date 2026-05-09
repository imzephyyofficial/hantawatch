/**
 * Cron entry point — runs every 6 hours per `vercel.json#crons`.
 *
 * Phase 2 plan:
 *   1. Run all adapters in parallel.
 *   2. Upsert results into Neon (countries + surveillance_records + events).
 *   3. `revalidateTag("dashboard")` to invalidate cache for pages.
 *   4. Write fetch_log row per source.
 *
 * Until Neon is provisioned, this route is a no-op that reports success
 * and lets the existing fixtures continue to power the UI.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchCdc } from "@/lib/etl/cdc";
import { fetchEcdc } from "@/lib/etl/ecdc";
import { fetchPaho } from "@/lib/etl/paho";
import { fetchWhoLive } from "@/lib/live";
import { isDbReady } from "@/lib/db/client";

export const maxDuration = 60;

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when set in env.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const started = new Date().toISOString();

  const [who, cdc, ecdc, paho] = await Promise.allSettled([
    fetchWhoLive(),
    fetchCdc(),
    fetchEcdc(),
    fetchPaho(),
  ]);

  const summary = [
    { source: "who",  status: who.status,  ok: who.status === "fulfilled" && who.value.ok,
      records: 0, events: who.status === "fulfilled" ? who.value.events.length : 0,
      fetched_at: who.status === "fulfilled" ? who.value.fetchedAt : null,
      error: who.status === "rejected" ? String(who.reason) : (who.status === "fulfilled" && !who.value.ok ? "fetch failed" : null) },
    { source: "cdc",  status: cdc.status,  ok: cdc.status === "fulfilled",
      records: cdc.status === "fulfilled" ? cdc.value.records.length : 0,
      events: cdc.status === "fulfilled" ? cdc.value.events.length : 0,
      fetched_at: cdc.status === "fulfilled" ? cdc.value.fetchedAt : null,
      error: cdc.status === "rejected" ? String(cdc.reason) : null },
    { source: "ecdc", status: ecdc.status, ok: ecdc.status === "fulfilled",
      records: ecdc.status === "fulfilled" ? ecdc.value.records.length : 0,
      events: ecdc.status === "fulfilled" ? ecdc.value.events.length : 0,
      fetched_at: ecdc.status === "fulfilled" ? ecdc.value.fetchedAt : null,
      error: ecdc.status === "rejected" ? String(ecdc.reason) : null },
    { source: "paho", status: paho.status, ok: paho.status === "fulfilled",
      records: paho.status === "fulfilled" ? paho.value.records.length : 0,
      events: paho.status === "fulfilled" ? paho.value.events.length : 0,
      fetched_at: paho.status === "fulfilled" ? paho.value.fetchedAt : null,
      error: paho.status === "rejected" ? String(paho.reason) : null },
  ];

  // Bust the dashboard cache so the next request re-fetches WHO via revalidate.
  revalidatePath("/");
  revalidatePath("/outbreaks");
  revalidatePath("/api/v1/live");

  return NextResponse.json({
    ok: true,
    db: isDbReady ? "connected" : "not provisioned",
    started,
    finished: new Date().toISOString(),
    summary,
    note: isDbReady
      ? "DB connected — adapters parsing wired for WHO; CDC/ECDC/PAHO stubbed pending Phase 2."
      : "Live WHO fetch active. CDC/ECDC/PAHO require Phase 2 (Neon).",
  });
}
