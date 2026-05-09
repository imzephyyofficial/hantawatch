/**
 * ETL adapter contract. Each source produces an array of NormalizedRecord.
 * The cron route merges these into the database.
 */

export interface NormalizedRecord {
  iso: string;
  country: string;
  region: "Americas" | "Europe" | "Asia" | "Africa" | "Oceania";
  cases: number;
  deaths: number;
  strain: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  status: "active" | "outbreak" | "monitored";
  source: string;
  sourceUrl?: string;
}

export interface NormalizedEvent {
  id: string;
  iso: string;
  country: string;
  severity: "low" | "medium" | "high";
  title: string;
  body: string;
  occurredAt: string; // YYYY-MM-DD
  source: string;
  sourceUrl?: string;
}

export interface AdapterResult {
  records: NormalizedRecord[];
  events: NormalizedEvent[];
  fetchedAt: string;
}

export type Adapter = () => Promise<AdapterResult>;
