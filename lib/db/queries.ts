/**
 * Typed query helpers over the Drizzle client. Centralizes table access so
 * pages and route handlers don't reach into the schema directly.
 *
 * All queries no-op safely when the DB isn't provisioned (returns [] / null).
 */

import { eq, and, desc, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./client";
import * as schema from "./schema";

export type UserRow = typeof schema.users.$inferSelect;
export type SubscriptionRow = typeof schema.subscriptions.$inferSelect;
export type ApiKeyRow = typeof schema.apiKeys.$inferSelect;

// ---------- users ----------

export async function upsertUser(opts: { id: string; email: string }) {
  if (!db) return null;
  const [row] = await db
    .insert(schema.users)
    .values({ id: opts.id, email: opts.email })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: { email: opts.email, lastSeenAt: new Date() },
    })
    .returning();
  return row;
}

export async function deleteUser(id: string) {
  if (!db) return;
  await db.delete(schema.users).where(eq(schema.users.id, id));
}

export async function touchLastSeen(id: string) {
  if (!db) return;
  await db
    .update(schema.users)
    .set({ lastSeenAt: new Date() })
    .where(eq(schema.users.id, id));
}

// ---------- subscriptions ----------

export interface SubscriptionFilter {
  regions?: string[];
  statuses?: Array<"outbreak" | "active" | "monitored">;
  strains?: string[];
  minSeverity?: "low" | "medium" | "high";
}

export async function listSubscriptions(userId: string): Promise<SubscriptionRow[]> {
  if (!db) return [];
  return db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .orderBy(desc(schema.subscriptions.createdAt));
}

export async function createSubscription(opts: {
  userId: string;
  name: string;
  filter: SubscriptionFilter;
  channel: "email" | "slack" | "webhook" | "rss";
  target: string;
}) {
  if (!db) return null;
  const [row] = await db
    .insert(schema.subscriptions)
    .values({
      userId: opts.userId,
      name: opts.name,
      filter: opts.filter,
      channel: opts.channel,
      target: opts.target,
    })
    .returning();
  return row;
}

export async function deleteSubscription(opts: { id: string; userId: string }) {
  if (!db) return null;
  const [row] = await db
    .delete(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.id, opts.id),
        eq(schema.subscriptions.userId, opts.userId)
      )
    )
    .returning();
  return row;
}

export async function activeSubscriptions(): Promise<SubscriptionRow[]> {
  if (!db) return [];
  return db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.active, 1));
}

export async function recordDispatch(opts: {
  subscriptionId: string;
  eventId: string;
  status: "ok" | "failed" | "skipped";
  error?: string;
}) {
  if (!db) return null;
  const [row] = await db
    .insert(schema.alertDispatches)
    .values({
      subscriptionId: opts.subscriptionId,
      eventId: opts.eventId,
      status: opts.status,
      error: opts.error,
    })
    .onConflictDoNothing()
    .returning();
  return row;
}

// ---------- api keys ----------

export interface NewApiKey {
  row: ApiKeyRow;
  /** Plain-text token shown to the user exactly once. */
  rawToken: string;
}

const PREFIX = "hw_";

export async function listApiKeys(userId: string): Promise<ApiKeyRow[]> {
  if (!db) return [];
  return db
    .select()
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.userId, userId),
        isNull(schema.apiKeys.revokedAt)
      )
    )
    .orderBy(desc(schema.apiKeys.createdAt));
}

export async function createApiKey(opts: {
  userId: string;
  name: string;
  scopes?: string[];
  rateLimitPerMinute?: number;
}): Promise<NewApiKey | null> {
  if (!db) return null;
  const raw = `${PREFIX}${randomBytes(32).toString("base64url")}`;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  const [row] = await db
    .insert(schema.apiKeys)
    .values({
      userId: opts.userId,
      name: opts.name,
      keyHash,
      prefix,
      scopes: opts.scopes ?? ["read"],
      rateLimitPerMinute: opts.rateLimitPerMinute ?? 60,
    })
    .returning();
  return { row, rawToken: raw };
}

export async function revokeApiKey(opts: { id: string; userId: string }) {
  if (!db) return null;
  const [row] = await db
    .update(schema.apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.apiKeys.id, opts.id),
        eq(schema.apiKeys.userId, opts.userId)
      )
    )
    .returning();
  return row;
}

/** Validate a raw token; returns the row + bumps lastUsedAt. */
export async function validateApiKey(raw: string): Promise<ApiKeyRow | null> {
  if (!db || !raw.startsWith(PREFIX)) return null;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.keyHash, keyHash),
        isNull(schema.apiKeys.revokedAt)
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // fire-and-forget bump
  db.update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, row.id))
    .then(() => undefined, () => undefined);
  return row;
}
