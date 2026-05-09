/**
 * Graceful DB client. While Phase 2 (Neon Postgres) is not yet provisioned,
 * `db` is null and all reads fall back to the bundled fixtures in lib/data.ts.
 *
 * After provisioning Neon via Vercel Marketplace:
 *   1. `npm install drizzle-orm @neondatabase/serverless drizzle-kit`
 *   2. uncomment the imports below
 *   3. run `drizzle-kit generate` and `drizzle-kit migrate`
 */

export const isDbReady = Boolean(process.env.DATABASE_URL);

// Uncomment after `npm install drizzle-orm @neondatabase/serverless`:
//
// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";
// import * as schema from "./schema";
//
// export const db = isDbReady
//   ? drizzle(neon(process.env.DATABASE_URL!), { schema })
//   : null;

export const db: null = null;
