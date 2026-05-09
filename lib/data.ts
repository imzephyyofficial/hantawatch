/**
 * Reference data only.
 *
 * Country surveillance numbers and outbreak events come from `lib/sources/`
 * which fetches WHO and CDC live. This file holds:
 *
 *   - strains:      virology reference (reservoir, syndrome, CFR range, etc.)
 *                   — reference material, not surveillance counts
 *   - dataSources:  links to the source of every live number
 */

import type { StrainInfo } from "./types";

export const strains: StrainInfo[] = [
  {
    name: "Andes",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Long-tailed pygmy rice rat (Oligoryzomys longicaudatus)",
    syndrome: "HCPS",
    geographicRange: ["Argentina", "Chile", "Bolivia"],
    cfrRange: [30, 50],
    description:
      "Highest documented person-to-person transmission among hantaviruses. Endemic to southern South America, especially Patagonia. Causes Hantavirus Cardiopulmonary Syndrome with rapid onset and high mortality.",
  },
  {
    name: "Sin Nombre",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Deer mouse (Peromyscus maniculatus)",
    syndrome: "HCPS",
    geographicRange: ["United States", "Canada"],
    cfrRange: [30, 40],
    description:
      "First identified during the 1993 Four Corners outbreak. Most common cause of HCPS in North America. Predominantly rural exposure through contaminated rodent excreta.",
  },
  {
    name: "Hantaan",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Striped field mouse (Apodemus agrarius)",
    syndrome: "HFRS",
    geographicRange: ["China", "South Korea", "Russia"],
    cfrRange: [5, 15],
    description:
      "Original prototype hantavirus identified during the Korean War. Causes severe HFRS with renal involvement. Vaccines available in China and South Korea.",
  },
  {
    name: "Puumala",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Bank vole (Myodes glareolus)",
    syndrome: "HFRS",
    geographicRange: ["Finland", "Sweden", "Germany", "Russia", "France"],
    cfrRange: [0.1, 1],
    description:
      "Mildest form of HFRS — nephropathia epidemica. Common across northern and central Europe. Strong seasonal pattern tied to rodent population cycles.",
  },
  {
    name: "Seoul",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Brown rat (Rattus norvegicus)",
    syndrome: "HFRS",
    geographicRange: ["Worldwide (cosmopolitan)"],
    cfrRange: [1, 2],
    description:
      "Globally distributed via the brown rat. Urban hantavirus. Cases reported in pet rat owners and laboratory workers worldwide.",
  },
  {
    name: "Laguna Negra",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Vesper mouse (Calomys laucha)",
    syndrome: "HCPS",
    geographicRange: ["Paraguay", "Bolivia", "Argentina", "Brazil"],
    cfrRange: [12, 35],
    description:
      "South American HCPS strain. Identified in Paraguay's Chaco region. Causes severe pulmonary disease with rapid progression.",
  },
];

export const dataSources = [
  { name: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
  { name: "CDC Hantavirus", url: "https://www.cdc.gov/hantavirus/data-research/cases/index.html" },
  { name: "ECDC Hantavirus", url: "https://www.ecdc.europa.eu/en/hantavirus-infection" },
  { name: "PAHO Hantavirus", url: "https://www.paho.org/en/topics/hantavirus" },
];
