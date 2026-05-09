/**
 * Drizzle schema for HantaWatch Phase 2 (Neon Postgres).
 *
 * Activate by:
 *   1. `npm install drizzle-orm @neondatabase/serverless drizzle-kit`
 *   2. provision Neon via Vercel Marketplace (DATABASE_URL injected)
 *   3. uncomment the import + table definitions below
 *   4. `npx drizzle-kit generate && npx drizzle-kit migrate`
 *
 * The shape mirrors `lib/types.ts` so the rest of the app can switch from
 * fixtures to DB reads without changing component contracts.
 */

// Uncomment after install:
//
// import { pgTable, varchar, integer, text, date, timestamp, real, primaryKey } from "drizzle-orm/pg-core";
//
// export const countries = pgTable("countries", {
//   iso: varchar("iso", { length: 2 }).primaryKey(),
//   name: varchar("name", { length: 80 }).notNull(),
//   flag: varchar("flag", { length: 8 }).notNull(),
//   region: varchar("region", { length: 24 }).notNull(),
//   population: integer("population"),
//   lat: real("lat"),
//   lng: real("lng"),
// });
//
// export const surveillanceRecords = pgTable("surveillance_records", {
//   id: varchar("id", { length: 80 }).primaryKey(),
//   countryIso: varchar("country_iso", { length: 2 }).notNull().references(() => countries.iso),
//   periodStart: date("period_start").notNull(),
//   periodEnd: date("period_end").notNull(),
//   cases: integer("cases").notNull(),
//   deaths: integer("deaths").notNull(),
//   strain: varchar("strain", { length: 64 }).notNull(),
//   status: varchar("status", { length: 16 }).notNull(),
//   source: varchar("source", { length: 64 }).notNull(),
//   sourceUrl: text("source_url"),
//   fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
// });
//
// export const events = pgTable("events", {
//   id: varchar("id", { length: 120 }).primaryKey(),
//   countryIso: varchar("country_iso", { length: 2 }).notNull().references(() => countries.iso),
//   severity: varchar("severity", { length: 8 }).notNull(),
//   title: text("title").notNull(),
//   body: text("body").notNull(),
//   occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
//   source: varchar("source", { length: 64 }),
//   sourceUrl: text("source_url"),
//   ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
// });
//
// export const strains = pgTable("strains", {
//   name: varchar("name", { length: 64 }).primaryKey(),
//   family: varchar("family", { length: 64 }).notNull(),
//   reservoir: text("reservoir").notNull(),
//   syndrome: varchar("syndrome", { length: 8 }).notNull(),
//   cfrLow: real("cfr_low").notNull(),
//   cfrHigh: real("cfr_high").notNull(),
//   description: text("description").notNull(),
// });
//
// export const fetchLog = pgTable("fetch_log", {
//   source: varchar("source", { length: 24 }).notNull(),
//   ranAt: timestamp("ran_at", { withTimezone: true }).notNull().defaultNow(),
//   status: varchar("status", { length: 8 }).notNull(),  // ok | error
//   recordsUpserted: integer("records_upserted"),
//   error: text("error"),
// }, (t) => ({
//   pk: primaryKey({ columns: [t.source, t.ranAt] }),
// }));

export const PLACEHOLDER = true;
