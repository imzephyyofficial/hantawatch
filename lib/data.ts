/**
 * Reference data only.
 *
 * Country surveillance numbers and outbreak events come from `lib/sources/`
 * which fetches WHO and CDC live. This file holds:
 *
 *   - strains:      virology reference (reservoir, syndrome, CFR range)
 *                   — reference material with citations to primary literature.
 *                   These are not surveillance counts; they describe the
 *                   diseases themselves and don't change with day-to-day
 *                   surveillance.
 *   - dataSources:  links to the primary publishers of every live number.
 *
 * Every strain entry below carries a `citations[]` array linking each
 * factual claim to a publicly accessible source. The `/methodology`
 * page surfaces these in the UI so users can verify directly.
 */

import type { StrainInfo } from "./types";

export interface CitedStrain extends StrainInfo {
  citations: Array<{ claim: string; source: string; url: string }>;
}

export const strains: CitedStrain[] = [
  {
    name: "Andes",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Long-tailed pygmy rice rat (Oligoryzomys longicaudatus)",
    syndrome: "HCPS",
    geographicRange: ["Argentina", "Chile", "Bolivia"],
    cfrRange: [30, 50],
    description:
      "First identified in Argentina in 1995. The only hantavirus with documented person-to-person transmission. Endemic to southern South America, especially Patagonia. Causes Hantavirus Cardiopulmonary Syndrome with rapid onset and high mortality.",
    citations: [
      { claim: "Reservoir species and South American distribution", source: "CDC Hantavirus — Health Care Providers", url: "https://www.cdc.gov/hantavirus/hcp/clinical-overview/hps.html" },
      { claim: "Person-to-person transmission of Andes virus", source: "Martínez et al. 2005, Emerging Infectious Diseases (CDC)", url: "https://wwwnc.cdc.gov/eid/article/11/12/04-0292_article" },
      { claim: "CFR range for HCPS in South America", source: "WHO Hantavirus factsheet", url: "https://www.who.int/news-room/fact-sheets/detail/hantavirus-disease" },
    ],
  },
  {
    name: "Sin Nombre",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Deer mouse (Peromyscus maniculatus)",
    syndrome: "HCPS",
    geographicRange: ["United States", "Canada"],
    cfrRange: [30, 40],
    description:
      "First identified during the 1993 Four Corners outbreak. Most common cause of HCPS in North America. Predominantly rural exposure through inhalation of aerosolized rodent excreta.",
    citations: [
      { claim: "Identification during the 1993 Four Corners outbreak and dominance in North American HCPS", source: "CDC Hantavirus — History of HPS surveillance", url: "https://www.cdc.gov/hantavirus/data-research/cases/index.html" },
      { claim: "Reservoir species (Peromyscus maniculatus)", source: "CDC Hantavirus — Reservoirs", url: "https://www.cdc.gov/hantavirus/about/index.html" },
      { claim: "CFR ~38% historically in the US", source: "CDC NNDSS surveillance summary, peer-reviewed at MMWR", url: "https://www.cdc.gov/mmwr/" },
    ],
  },
  {
    name: "Hantaan",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Striped field mouse (Apodemus agrarius)",
    syndrome: "HFRS",
    geographicRange: ["China", "South Korea", "Russia"],
    cfrRange: [5, 15],
    description:
      "Original prototype hantavirus, named after the Hantan River in South Korea where it was first isolated. Causes severe HFRS with renal involvement. Vaccines have been licensed in China and South Korea.",
    citations: [
      { claim: "Type-species naming and isolation", source: "Lee et al. 1978, Journal of Infectious Diseases", url: "https://pubmed.ncbi.nlm.nih.gov/24670/" },
      { claim: "HFRS clinical course and CFR range", source: "WHO Hantavirus factsheet", url: "https://www.who.int/news-room/fact-sheets/detail/hantavirus-disease" },
      { claim: "Licensed HFRS vaccines in PRC + ROK", source: "Schmaljohn 2009, Vaccine (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/19837139/" },
    ],
  },
  {
    name: "Puumala",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Bank vole (Myodes glareolus)",
    syndrome: "HFRS",
    geographicRange: ["Finland", "Sweden", "Germany", "Russia", "France"],
    cfrRange: [0.1, 1],
    description:
      "Mildest form of HFRS — known clinically as nephropathia epidemica. Common across northern and central Europe. Strong seasonal pattern tied to bank-vole population cycles.",
    citations: [
      { claim: "Mild HFRS / nephropathia epidemica designation", source: "ECDC — Hantavirus infection facts", url: "https://www.ecdc.europa.eu/en/hantavirus-infection/facts" },
      { claim: "Reservoir and geographic range", source: "CDC Hantavirus — clinical overview HFRS", url: "https://www.cdc.gov/hantavirus/hcp/clinical-overview/hfrs.html" },
      { claim: "CFR <1% in Europe", source: "ECDC Annual Epidemiological Report — hantavirus infection", url: "https://www.ecdc.europa.eu/en/hantavirus-infection" },
    ],
  },
  {
    name: "Seoul",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Brown rat (Rattus norvegicus)",
    syndrome: "HFRS",
    geographicRange: ["Worldwide (cosmopolitan)"],
    cfrRange: [1, 2],
    description:
      "Globally distributed via the brown rat — an urban hantavirus. Cases reported worldwide in pet-rat owners and laboratory workers; multiple outbreaks tied to rat-breeding facilities.",
    citations: [
      { claim: "Cosmopolitan distribution via Rattus norvegicus", source: "CDC Hantavirus — clinical overview HFRS", url: "https://www.cdc.gov/hantavirus/hcp/clinical-overview/hfrs.html" },
      { claim: "Pet-rat-associated outbreaks", source: "CDC MMWR 2017, Seoul virus in pet rats", url: "https://www.cdc.gov/mmwr/volumes/66/wr/mm6604a1.htm" },
    ],
  },
  {
    name: "Laguna Negra",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Vesper mouse (Calomys laucha)",
    syndrome: "HCPS",
    geographicRange: ["Paraguay", "Bolivia", "Argentina", "Brazil"],
    cfrRange: [12, 35],
    description:
      "Identified in Paraguay's Chaco region. South American HCPS strain. Causes severe pulmonary disease with rapid progression similar to Andes virus, though with somewhat lower CFR in published case series.",
    citations: [
      { claim: "First identification in Paraguay's Chaco region", source: "Johnson et al. 1997, Virology (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/9434739/" },
      { claim: "Reservoir Calomys laucha", source: "PAHO — Hantavirus topic page", url: "https://www.paho.org/en/topics/hantavirus" },
    ],
  },
];

/**
 * Top-level data-source documents users can verify against.
 */
export const dataSources = [
  { name: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
  { name: "WHO Hantavirus factsheet", url: "https://www.who.int/news-room/fact-sheets/detail/hantavirus-disease" },
  { name: "CDC Hantavirus", url: "https://www.cdc.gov/hantavirus/data-research/cases/index.html" },
  { name: "CDC MMWR", url: "https://www.cdc.gov/mmwr/" },
  { name: "ECDC Hantavirus", url: "https://www.ecdc.europa.eu/en/hantavirus-infection" },
  { name: "PAHO Hantavirus", url: "https://www.paho.org/en/topics/hantavirus" },
];
