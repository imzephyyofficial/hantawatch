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
import { fetchWho } from "@/lib/etl/who";
import { fetchCdc } from "@/lib/etl/cdc";
import { fetchEcdc } from "@/lib/etl/ecdc";
import { fetchPaho } from "@/lib/etl/paho";
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

  const results = await Promise.allSettled([
    fetchWho(),
    fetchCdc(),
    fetchEcdc(),
    fetchPaho(),
  ]);

  const summary = results.map((r, i) => ({
    source: ["who", "cdc", "ecdc", "paho"][i],
    status: r.status,
    records: r.status === "fulfilled" ? r.value.records.length : 0,
    events: r.status === "fulfilled" ? r.value.events.length : 0,
    error: r.status === "rejected" ? String(r.reason) : null,
  }));

  // TODO Phase 2: when isDbReady, upsert + revalidateTag("dashboard")
  // import { revalidateTag } from "next/cache";
  // await db.transaction(async (tx) => { ... });
  // revalidateTag("dashboard");

  return NextResponse.json({
    ok: true,
    db: isDbReady ? "connected" : "not provisioned",
    started,
    finished: new Date().toISOString(),
    summary,
    note: isDbReady
      ? "DB connected — adapters still stubbed; implement parsing in lib/etl/*"
      : "Phase 2 not active. Provision Neon, then implement adapters.",
  });
}
