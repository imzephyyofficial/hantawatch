import type { OutbreakEvent, StrainInfo } from "./types";
import type { CountrySnapshot } from "./sources";
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
    name: "HantaWatch Live Hantavirus Surveillance",
    description: "Live hantavirus surveillance pulled from WHO Disease Outbreak News and CDC. Country reporting, outbreak events, and strain reference.",
    url: `${BASE}/surveillance`,
    keywords: ["hantavirus", "surveillance", "epidemiology", "HCPS", "HFRS", "WHO", "CDC"],
    license: "https://opensource.org/licenses/MIT",
    creator: { "@type": "Organization", name: "HantaWatch" },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${BASE}/api/v1/countries?format=csv` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${BASE}/api/v1/countries` },
    ],
  };
}

export function countrySchema(r: CountrySnapshot) {
  const props: Array<{ "@type": "PropertyValue"; name: string; value: unknown; unitText?: string }> = [];
  if (r.cases != null) props.push({ "@type": "PropertyValue", name: "cases", value: r.cases });
  if (r.deaths != null) props.push({ "@type": "PropertyValue", name: "deaths", value: r.deaths });
  if (r.cases != null && r.deaths != null)
    props.push({ "@type": "PropertyValue", name: "case_fatality_rate", value: +cfr(r.deaths, r.cases)!.toFixed(2), unitText: "percent" });
  if (r.strain) props.push({ "@type": "PropertyValue", name: "predominant_strain", value: r.strain });
  if (r.status) props.push({ "@type": "PropertyValue", name: "status", value: r.status });
  props.push({ "@type": "PropertyValue", name: "last_report", value: r.lastReport });
  props.push({ "@type": "PropertyValue", name: "source", value: r.source });

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: r.country,
    additionalProperty: props,
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
