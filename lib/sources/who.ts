/**
 * WHO Disease Outbreak News (DON) — live source.
 *
 * Public OData API at /api/news/diseaseoutbreaknews. Each entry has the full
 * structured DON content: Title, Summary, Overview, Epidemiology, Assessment,
 * Advice, Response, FurtherInformation, PublicationDate, ItemDefaultUrl.
 *
 * We filter for hantavirus and extract:
 *   - top-level event metadata
 *   - total cases / deaths / CFR (parsed from Summary)
 *   - list of countries mentioned (Overview)
 *   - severity heuristic
 */

import type { CaseBreakdown, Severity } from "../types";

export interface WhoEvent {
  id: string;                 // WHO UrlName (e.g. "2026-DON600")
  publicationDate: string;    // ISO
  title: string;
  summary: string;
  overview: string;
  countries: string[];        // distinct countries mentioned
  breakdown: CaseBreakdown;
  cfrPct: number | null;
  strain: string | null;      // best guess (Andes / Sin Nombre / Hantaan / Puumala / Seoul / Laguna Negra)
  severity: Severity;
  url: string;
}

interface WhoApiItem {
  Id: string;
  PublicationDate: string;
  UrlName?: string;
  ItemDefaultUrl?: string;
  Title?: string;
  Summary?: string;
  Overview?: string;
  Epidemiology?: string;
  Response?: string;
}

const API =
  "https://www.who.int/api/news/diseaseoutbreaknews" +
  "?$filter=contains(Title,%27antavirus%27)" +
  "&$orderby=PublicationDate%20desc" +
  "&$top=20" +
  "&$select=Id,UrlName,ItemDefaultUrl,Title,PublicationDate,Summary,Overview,Epidemiology,Response";

const KNOWN_COUNTRIES = [
  "Argentina","Bolivia","Brazil","Canada","Chile","Colombia","Mexico","Panama","Paraguay","Peru","United States","United States of America","Uruguay","Venezuela",
  "China","Japan","Republic of Korea","South Korea","Russia","Russian Federation","Mongolia","India",
  "Austria","Belgium","Czech Republic","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","Italy","Latvia","Lithuania","Luxembourg","Netherlands","Norway","Poland","Portugal","Romania","Serbia","Slovakia","Slovenia","Spain","Sweden","Switzerland","Turkey","Ukraine","United Kingdom","United Kingdom of Great Britain and Northern Ireland",
  "South Africa","Cabo Verde","Cape Verde","Mozambique",
  "Australia",
];

export async function fetchWhoEvents(): Promise<{ events: WhoEvent[]; fetchedAt: string; ok: boolean }> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(API, {
      headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { events: [], fetchedAt, ok: false };
    const json = (await res.json()) as { value?: WhoApiItem[] };
    const events = (json.value ?? [])
      .filter((it) => Boolean(it.Title) && Boolean(it.PublicationDate))
      .filter((it) => !/^1\d{3}/.test(String(it.UrlName ?? ""))) // skip 1990s archive
      .map(parseEvent);
    return { events, fetchedAt, ok: true };
  } catch {
    return { events: [], fetchedAt, ok: false };
  }
}

function parseEvent(item: WhoApiItem): WhoEvent {
  const summary = strip(item.Summary ?? "");
  const overview = strip(item.Overview ?? "");
  const epidemiology = strip(item.Epidemiology ?? "");
  const corpus = `${summary} ${overview}`;

  const countries = extractCountries(`${summary} ${overview} ${item.Response ?? ""}`);
  const breakdown = extractBreakdown(corpus);
  const cfrPct = extractCfr(corpus, breakdown);
  const strain = extractStrain(`${summary} ${overview} ${epidemiology}`);
  const severity: Severity =
    /multi.?country|cluster|outbreak/i.test(item.Title ?? "") || (breakdown.deceased ?? 0) > 0
      ? "high"
      : "medium";

  return {
    id: item.UrlName ?? item.Id,
    publicationDate: item.PublicationDate,
    title: clean(item.Title ?? ""),
    summary,
    overview,
    countries,
    breakdown,
    cfrPct,
    strain,
    severity,
    url: item.ItemDefaultUrl
      ? `https://www.who.int${item.ItemDefaultUrl}`
      : "https://www.who.int/emergencies/disease-outbreak-news",
  };
}

function extractCountries(text: string): string[] {
  const found = new Set<string>();
  for (const c of KNOWN_COUNTRIES) {
    const re = new RegExp(`\\b${c.replace(/ /g, "\\s+")}\\b`, "i");
    if (re.test(text)) {
      // canonicalize aliases
      if (c === "Cape Verde") found.add("Cabo Verde");
      else if (c === "United States of America") found.add("United States");
      else if (c === "Republic of Korea") found.add("South Korea");
      else if (c === "Russian Federation") found.add("Russia");
      else if (c === "United Kingdom of Great Britain and Northern Ireland") found.add("United Kingdom");
      else if (c === "Czech Republic") found.add("Czechia");
      else found.add(c);
    }
  }
  return Array.from(found);
}

const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
};
const NUM = `(\\d{1,5}|${Object.keys(WORD_TO_NUM).join("|")})`;

function parseNum(s: string): number | null {
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  return WORD_TO_NUM[s.toLowerCase()] ?? null;
}

function firstMatch(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseNum(m[1]);
      if (n != null) return n;
    }
  }
  return null;
}

function extractBreakdown(text: string): CaseBreakdown {
  const reported = firstMatch(text, [
    new RegExp(`(?:total of\\s+|reported\\s+a\\s+total\\s+of\\s+)?${NUM}\\s+cases?`, "i"),
    new RegExp(`${NUM}\\s+(?:total\\s+)?cases?\\s+(?:have\\s+been\\s+)?reported`, "i"),
  ]);

  const confirmed = firstMatch(text, [
    new RegExp(`${NUM}\\s+(?:confirmed|laboratory[- ]confirmed)\\s+cases?`, "i"),
    new RegExp(`${NUM}\\s+cases?\\s+(?:have\\s+been\\s+)?(?:laboratory[- ]?)?confirmed`, "i"),
    new RegExp(`(?:six|seven|eight|nine|ten|eleven|twelve|\\d{1,5})\\s+\\((${NUM.slice(1, -1)})\\s+confirmed`, "i"),
  ]);

  const probable = firstMatch(text, [
    new RegExp(`${NUM}\\s+(?:probable|suspected)\\s+cases?`, "i"),
    new RegExp(`(?:and\\s+)?${NUM}\\s+probable`, "i"),
  ]);

  const hospitalized = firstMatch(text, [
    // "four patients are currently hospitalised"
    new RegExp(`${NUM}\\s+(?:patients?|cases?)(?:\\s+\\w+){0,3}\\s+(?:hospitalised|hospitalized|admitted)`, "i"),
    new RegExp(`${NUM}\\s+(?:hospitalisations?|hospitalizations?)`, "i"),
  ]);

  const critical = firstMatch(text, [
    new RegExp(`${NUM}\\s+(?:critically\\s+ill|in\\s+intensive\\s+care|in\\s+ICU)`, "i"),
    new RegExp(`(?:one|${NUM})\\s+(?:in\\s+intensive\\s+care|critically\\s+ill)`, "i"),
  ]);

  const deceased = firstMatch(text, [
    new RegExp(`(?:including\\s+|of\\s+(?:which|whom)\\s+)?${NUM}\\s+deaths?`, "i"),
    new RegExp(`${NUM}\\s+(?:fatalities|fatal\\s+cases?)`, "i"),
    new RegExp(`(?:with|including)\\s+${NUM}\\s+death`, "i"),
  ]);

  const recovered = firstMatch(text, [
    // "five patients have recovered" / "five patients were discharged"
    new RegExp(`${NUM}\\s+(?:patients?|cases?)(?:\\s+\\w+){0,3}\\s+(?:recovered|discharged|recovered\\s+and\\s+discharged)`, "i"),
    new RegExp(`${NUM}\\s+recoveries`, "i"),
    new RegExp(`${NUM}\\s+(?:fully\\s+)?recovered`, "i"),
  ]);

  return { reported, confirmed, probable, hospitalized, critical, deceased, recovered };
}

function extractCfr(text: string, b: CaseBreakdown): number | null {
  const direct = text.match(/case\s+fatality\s+rat\w+\s+(?:of\s+)?(\d{1,3}(?:\.\d+)?)\s*%?/i);
  if (direct) return parseFloat(direct[1]);
  if (b.reported && b.deceased != null && b.reported > 0) {
    return (b.deceased / b.reported) * 100;
  }
  return null;
}

function extractStrain(text: string): string | null {
  if (/Andes\s+virus|ANDV|orthohantavirus\s+andesense/i.test(text)) return "Andes";
  if (/Sin\s+Nombre|SNV/i.test(text)) return "Sin Nombre";
  if (/Hantaan(?:\s+virus)?|HTNV/i.test(text)) return "Hantaan";
  if (/Puumala|PUUV/i.test(text)) return "Puumala";
  if (/Seoul\s+virus|SEOV/i.test(text)) return "Seoul";
  if (/Laguna\s+Negra|LANV/i.test(text)) return "Laguna Negra";
  return null;
}

function strip(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;|&mdash;/g, "—")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
