import type { OutbreakEvent, StrainInfo, SurveillanceRecord } from "./types";
import { cfr } from "./format";

const BASE = "https://hantawatch-global.vercel.app";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HantaWatch",
    url: BASE,
    description: "Global hantavirus surveillance dashboard",
  };
}

export function datasetSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "HantaWatch Country Surveillance",
    description: "Country-level hantavirus surveillance: cumulative cases, deaths, CFR, predominant strain, and reporting status.",
    url: `${BASE}/surveillance`,
    keywords: ["hantavirus", "surveillance", "epidemiology", "HCPS", "HFRS"],
    license: "https://opensource.org/licenses/MIT",
    creator: { "@type": "Organization", name: "HantaWatch" },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${BASE}/api/v1/countries?format=csv` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${BASE}/api/v1/countries` },
    ],
  };
}

export function countrySchema(r: SurveillanceRecord) {
  const pct = cfr(r.deaths, r.cases);
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: r.country,
    additionalProperty: [
      { "@type": "PropertyValue", name: "cases", value: r.cases },
      { "@type": "PropertyValue", name: "deaths", value: r.deaths },
      { "@type": "PropertyValue", name: "case_fatality_rate", value: +pct.toFixed(2), unitText: "percent" },
      { "@type": "PropertyValue", name: "predominant_strain", value: r.strain },
      { "@type": "PropertyValue", name: "status", value: r.status },
      { "@type": "PropertyValue", name: "last_report", value: r.lastReport },
    ],
  };
}

export function outbreakSchema(e: OutbreakEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.body,
    startDate: e.date,
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.country },
    url: `${BASE}/outbreaks/${e.id}`,
    organizer: e.source ? { "@type": "Organization", name: e.source, url: e.sourceUrl } : undefined,
  };
}

export function strainSchema(s: StrainInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalCondition",
    name: `${s.name} virus`,
    alternateName: `${s.name} hantavirus`,
    description: s.description,
    associatedAnatomy: s.syndrome === "HCPS" ? "Lung" : "Kidney",
    typicalTest: { "@type": "MedicalTest", name: "RT-PCR / serology" },
  };
}
