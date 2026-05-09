/**
 * Drizzle client over @neondatabase/serverless (HTTP transport — works in
 * edge + serverless without a long-lived TCP pool).
 *
 * Vercel-Native Neon integration injects DATABASE_URL at runtime; locally
 * the value comes from `vercel env pull`. If neither is present, `db` is
 * null and callers should degrade gracefully (e.g. user-facing pages just
 * skip account features).
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

export const isDbReady = Boolean(url);

export const db = url ? drizzle(neon(url), { schema, casing: "snake_case" }) : null;

export type DB = NonNullable<typeof db>;

export * as schema from "./schema";
