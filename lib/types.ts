export type Region = "Americas" | "Europe" | "Asia" | "Africa" | "Oceania";
export type Status = "active" | "outbreak" | "monitored";
export type Severity = "low" | "medium" | "high";

export interface SurveillanceRecord {
  iso: string;          // ISO-3166 alpha-2, lowercase ("ar", "us")
  country: string;
  flag: string;
  region: Region;
  cases: number;
  deaths: number;
  strain: string;
  lastReport: string;   // ISO date YYYY-MM-DD
  status: Status;
  population?: number;
  notes?: string;
}

export interface OutbreakEvent {
  id: string;
  date: string;         // ISO date
  country: string;
  iso: string;
  flag: string;
  severity: Severity;
  title: string;
  body: string;
  source?: string;
  sourceUrl?: string;
}

export interface StrainInfo {
  name: string;
  family: string;
  reservoir: string;
  syndrome: "HCPS" | "HFRS" | "Mixed";
  geographicRange: string[];
  cfrRange: [number, number];
  description: string;
}

export interface WeeklyTimeline {
  labels: string[];
  americas: number[];
  europe: number[];
  asia: number[];
}

export interface StrainAggregate {
  name: string;
  cases: number;
  deaths: number;
  countries: number;
  cfr: number;
}
