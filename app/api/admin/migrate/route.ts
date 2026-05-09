/**
 * One-time migrate endpoint. Gated by MIGRATE_SECRET (set in Vercel env).
 * Idempotent — Drizzle's migrator tracks applied migrations in a metadata
 * table, so hitting this twice is safe.
 *
 * Usage:
 *   curl -X POST -H "x-migrate-secret: $SECRET" https://.../api/admin/migrate
 */

import { NextResponse } from "next/server";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db, isDbReady } from "@/lib/db/client";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const secret = req.headers.get("x-migrate-secret");
  const expected = process.env.MIGRATE_SECRET;
  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDbReady || !db) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const startedAt = new Date().toISOString();
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "lib/db/migrations") });
    return NextResponse.json({ ok: true, started: startedAt, finished: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err), started: startedAt, finished: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// Allow GET to check that the endpoint is reachable + secret-protected
export async function GET(req: Request) {
  const secret = req.headers.get("x-migrate-secret");
  const expected = process.env.MIGRATE_SECRET;
  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    db: isDbReady ? "ready" : "not_configured",
    note: "POST to apply migrations.",
  });
}
