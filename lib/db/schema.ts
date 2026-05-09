/**
 * Drizzle schema — Neon Postgres via Vercel-Native integration.
 *
 * Initial scope is *user-domain* data. Country surveillance + outbreak events
 * continue to live in the live source layer (lib/sources/). The DB is for:
 *   - users / accounts (via Clerk; we mirror just the bits we need)
 *   - subscriptions (filter spec + delivery channel)
 *   - api_keys (issued by users for programmatic access)
 *   - alert_dispatches (which subscription got which event when — idempotency)
 *   - source_fetch_log (per-source observability — when did the cron run, what changed)
 *   - annotations (auth'd contributors flag/correct values)
 */

import { pgTable, varchar, text, timestamp, integer, jsonb, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),  // Clerk user_id
  email: varchar("email", { length: 254 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    // Filter spec — JSON for flexibility. Shape:
    //   { regions?: string[], statuses?: ("outbreak"|"active"|"monitored")[], strains?: string[], minSeverity?: "low"|"medium"|"high" }
    filter: jsonb("filter").notNull().default(sql`'{}'::jsonb`),
    channel: varchar("channel", { length: 16 }).notNull(), // "email" | "slack" | "webhook" | "rss"
    target: text("target").notNull(),                       // email address, slack URL, webhook URL, or "self" for RSS
    active: integer("active").notNull().default(1),         // 1=on, 0=paused
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUser: index("subscriptions_user_idx").on(t.userId),
  })
);

export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  // Stored as a SHA-256 hash. We hand the user the raw token once, never again.
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
  prefix: varchar("prefix", { length: 12 }).notNull(),  // first 8 chars shown in UI
  scopes: jsonb("scopes").notNull().default(sql`'["read"]'::jsonb`),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const alertDispatches = pgTable(
  "alert_dispatches",
  {
    subscriptionId: varchar("subscription_id", { length: 36 }).notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
    eventId: varchar("event_id", { length: 120 }).notNull(),    // OutbreakEvent.id from sources
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }).notNull().defaultNow(),
    status: varchar("status", { length: 16 }).notNull(),         // "ok" | "failed" | "skipped"
    error: text("error"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.subscriptionId, t.eventId] }),  // idempotency
  })
);

export const sourceFetchLog = pgTable("source_fetch_log", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source", { length: 24 }).notNull(),
  ranAt: timestamp("ran_at", { withTimezone: true }).notNull().defaultNow(),
  status: varchar("status", { length: 8 }).notNull(),  // "ok" | "error"
  recordsSeen: integer("records_seen"),
  error: text("error"),
});

export const annotations = pgTable(
  "annotations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 64 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    targetKind: varchar("target_kind", { length: 16 }).notNull(), // "country" | "event" | "strain"
    targetId: varchar("target_id", { length: 120 }).notNull(),
    body: text("body").notNull(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byTarget: index("annotations_target_idx").on(t.targetKind, t.targetId),
  })
);
