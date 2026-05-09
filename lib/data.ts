import type { SurveillanceRecord, OutbreakEvent, StrainInfo, WeeklyTimeline } from "./types";

export const surveillanceData: SurveillanceRecord[] = [
  { iso: "cn", country: "China",         flag: "🇨🇳", region: "Asia",     cases: 15847, deaths: 1584, strain: "Hantaan/Seoul", lastReport: "2026-05-07", status: "active",    population: 1410000000 },
  { iso: "fi", country: "Finland",       flag: "🇫🇮", region: "Europe",   cases:  1247, deaths:   12, strain: "Puumala",       lastReport: "2026-05-08", status: "active",    population:    5550000 },
  { iso: "us", country: "United States", flag: "🇺🇸", region: "Americas", cases:   892, deaths:  294, strain: "Sin Nombre",    lastReport: "2026-05-06", status: "active",    population:  331000000 },
  { iso: "de", country: "Germany",       flag: "🇩🇪", region: "Europe",   cases:   623, deaths:    9, strain: "Puumala",       lastReport: "2026-05-05", status: "active",    population:   83200000 },
  { iso: "se", country: "Sweden",        flag: "🇸🇪", region: "Europe",   cases:   456, deaths:    7, strain: "Puumala",       lastReport: "2026-05-04", status: "active",    population:   10400000 },
  { iso: "ar", country: "Argentina",     flag: "🇦🇷", region: "Americas", cases:   387, deaths:  147, strain: "Andes",         lastReport: "2026-05-08", status: "outbreak",  population:   45800000 },
  { iso: "cl", country: "Chile",         flag: "🇨🇱", region: "Americas", cases:   156, deaths:   52, strain: "Andes",         lastReport: "2026-05-07", status: "active",    population:   19500000 },
  { iso: "kr", country: "South Korea",   flag: "🇰🇷", region: "Asia",     cases:   234, deaths:   23, strain: "Hantaan",       lastReport: "2026-05-06", status: "active",    population:   51800000 },
  { iso: "br", country: "Brazil",        flag: "🇧🇷", region: "Americas", cases:    89, deaths:   34, strain: "Laguna Negra",  lastReport: "2026-05-05", status: "monitored", population:  214000000 },
  { iso: "nl", country: "Netherlands",   flag: "🇳🇱", region: "Europe",   cases:     8, deaths:    3, strain: "Andes (imported)", lastReport: "2026-05-08", status: "outbreak", population: 17500000 },
  { iso: "za", country: "South Africa",  flag: "🇿🇦", region: "Africa",   cases:     5, deaths:    2, strain: "Andes (imported)", lastReport: "2026-05-08", status: "outbreak", population: 60000000 },
  { iso: "ch", country: "Switzerland",   flag: "🇨🇭", region: "Europe",   cases:     3, deaths:    0, strain: "Andes (imported)", lastReport: "2026-05-07", status: "monitored", population: 8700000 },
];

export const outbreakEvents: OutbreakEvent[] = [
  { id: "mv-hondius-2026",    date: "2026-05-08", iso: "nl", country: "Netherlands",   flag: "🇳🇱", severity: "high",   title: "MV Hondius cluster — 8 cases, 3 deaths",   body: "Andes virus outbreak aboard cruise vessel docked in Rotterdam. Contact tracing in progress; ports of call notified.",                                source: "WHO DON",         sourceUrl: "https://www.who.int/emergencies/disease-outbreak-news" },
  { id: "south-africa-2026",  date: "2026-05-08", iso: "za", country: "South Africa",  flag: "🇿🇦", severity: "high",   title: "Imported Andes virus — 5 cases",            body: "All cases traceable to MV Hondius port call. Index patient hospitalized in Cape Town. NICD coordinating response.",                                  source: "NICD",            sourceUrl: "https://www.nicd.ac.za/" },
  { id: "argentina-patagonia-2026", date: "2026-05-08", iso: "ar", country: "Argentina", flag: "🇦🇷", severity: "high", title: "Patagonia surveillance update",            body: "Ongoing seasonal Andes virus activity in Río Negro and Chubut. CFR 38% sustained. Provincial ministries enhancing rural outreach.",                  source: "PAHO",            sourceUrl: "https://www.paho.org/en/topics/hantavirus" },
  { id: "finland-puumala-2026", date: "2026-05-08", iso: "fi", country: "Finland",       flag: "🇫🇮", severity: "medium", title: "Puumala virus seasonal peak",             body: "Karelia and Lapland reporting expected seasonal increase in HFRS cases. CFR remains <2%. THL monitoring rodent reservoir density.",                 source: "THL",             sourceUrl: "https://thl.fi/en/" },
  { id: "switzerland-import-2026", date: "2026-05-07", iso: "ch", country: "Switzerland", flag: "🇨🇭", severity: "low",  title: "Imported case — under monitoring",        body: "Returning traveler from South America under enhanced surveillance. No secondary cases. BAG investigating exposure timeline.",                       source: "BAG",             sourceUrl: "https://www.bag.admin.ch/" },
  { id: "china-q1-2026",      date: "2026-05-07", iso: "cn", country: "China",         flag: "🇨🇳", severity: "medium", title: "Northeast provinces — quarterly report",   body: "Hantaan/Seoul activity stable. Vaccination campaign in Heilongjiang continuing. NHC reports lower-than-expected case load for the period.",        source: "NHC China",       sourceUrl: "http://en.nhc.gov.cn/" },
  { id: "us-fourcorners-2026", date: "2026-05-06", iso: "us", country: "United States", flag: "🇺🇸", severity: "medium", title: "Four Corners region notice",              body: "CDC issues seasonal advisory for Sin Nombre virus exposure risk in rural Southwest. Recreational rodent contact and food storage emphasized.",     source: "CDC",             sourceUrl: "https://www.cdc.gov/hantavirus/" },
  { id: "brazil-mato-grosso-2026", date: "2026-05-05", iso: "br", country: "Brazil",    flag: "🇧🇷", severity: "low",   title: "Laguna Negra virus — sporadic cases",     body: "Mato Grosso and Goiás reporting isolated cases consistent with baseline. SES coordinating with regional reference labs.",                          source: "Ministério da Saúde", sourceUrl: "https://www.gov.br/saude/" },
];

export const strains: StrainInfo[] = [
  {
    name: "Andes",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Long-tailed pygmy rice rat (Oligoryzomys longicaudatus)",
    syndrome: "HCPS",
    geographicRange: ["Argentina", "Chile", "Bolivia"],
    cfrRange: [30, 50],
    description: "Highest documented person-to-person transmission among hantaviruses. Endemic to southern South America, especially Patagonia. Causes Hantavirus Cardiopulmonary Syndrome with rapid onset and high mortality.",
  },
  {
    name: "Sin Nombre",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Deer mouse (Peromyscus maniculatus)",
    syndrome: "HCPS",
    geographicRange: ["United States", "Canada"],
    cfrRange: [30, 40],
    description: "First identified during the 1993 Four Corners outbreak. Most common cause of HCPS in North America. Predominantly rural exposure through contaminated rodent excreta.",
  },
  {
    name: "Hantaan",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Striped field mouse (Apodemus agrarius)",
    syndrome: "HFRS",
    geographicRange: ["China", "South Korea", "Russia"],
    cfrRange: [5, 15],
    description: "Original prototype hantavirus identified during the Korean War. Causes severe HFRS with renal involvement. Vaccines available in China and South Korea.",
  },
  {
    name: "Puumala",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Bank vole (Myodes glareolus)",
    syndrome: "HFRS",
    geographicRange: ["Finland", "Sweden", "Germany", "Russia", "France"],
    cfrRange: [0.1, 1],
    description: "Mildest form of HFRS — nephropathia epidemica. Common across northern and central Europe. Strong seasonal pattern tied to rodent population cycles.",
  },
  {
    name: "Seoul",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Brown rat (Rattus norvegicus)",
    syndrome: "HFRS",
    geographicRange: ["Worldwide (cosmopolitan)"],
    cfrRange: [1, 2],
    description: "Globally distributed via the brown rat. Urban hantavirus. Cases reported in pet rat owners and laboratory workers worldwide.",
  },
  {
    name: "Laguna Negra",
    family: "Hantaviridae · Orthohantavirus",
    reservoir: "Vesper mouse (Calomys laucha)",
    syndrome: "HCPS",
    geographicRange: ["Paraguay", "Bolivia", "Argentina", "Brazil"],
    cfrRange: [12, 35],
    description: "South American HCPS strain. Identified in Paraguay's Chaco region. Causes severe pulmonary disease with rapid progression.",
  },
];

export const weeklyTimeline: WeeklyTimeline = (() => {
  const labels: string[] = [];
  const today = new Date("2026-05-08T00:00:00Z");
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i * 7);
    labels.push(d.toISOString().slice(0, 10));
  }
  return {
    labels,
    americas: [28, 31, 27, 33, 38, 41, 39, 47, 52, 58, 64, 71],
    europe:   [124, 118, 131, 142, 156, 168, 174, 181, 193, 205, 212, 218],
    asia:     [203, 219, 231, 228, 247, 256, 268, 274, 289, 302, 318, 334],
  };
})();

export const dataSources = [
  { name: "WHO Disease Outbreak News", url: "https://www.who.int/emergencies/disease-outbreak-news" },
  { name: "CDC Hantavirus Surveillance", url: "https://www.cdc.gov/hantavirus/surveillance/index.html" },
  { name: "ECDC Hantavirus", url: "https://www.ecdc.europa.eu/en/hantavirus-infection" },
  { name: "PAHO Hantavirus", url: "https://www.paho.org/en/topics/hantavirus" },
];
