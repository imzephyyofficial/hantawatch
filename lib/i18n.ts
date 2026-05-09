/**
 * Lightweight UI strings for surfaces that benefit most from localization.
 * Full UI i18n would use next-intl; this is a focused subset for the
 * highest-value moments (welcome modal, language picker, status pills).
 *
 * Languages prioritized: English, Spanish (Andes-region active outbreaks),
 * Portuguese (Brazil + endemic).
 */

export type Locale = "en" | "es" | "pt";

export const LOCALES: { code: Locale; label: string; nativeName: string }[] = [
  { code: "en", label: "English",    nativeName: "English" },
  { code: "es", label: "Spanish",    nativeName: "Español" },
  { code: "pt", label: "Portuguese", nativeName: "Português" },
];

interface Strings {
  welcome: {
    title: string;
    subtitle: string;
    activeTitle: string;
    activeBody: string;
    historicalTitle: string;
    historicalBody: string;
    endemicTitle: string;
    endemicBody: string;
    disclaimer: string;
    cta: string;
  };
  languagePickerLabel: string;
}

export const STRINGS: Record<Locale, Strings> = {
  en: {
    welcome: {
      title: "Welcome to HantaWatch",
      subtitle: "A signal-based view on hantavirus — what to expect",
      activeTitle: "Active alerts",
      activeBody:
        "Recent outbreak signals from WHO Disease Outbreak News. Pulsing red markers — these are the hot zones right now.",
      historicalTitle: "Historical reporting",
      historicalBody:
        "Cumulative case counts published by CDC NNDSS, with US state-level breakdowns. Amber markers, sized by case load.",
      endemicTitle: "Endemic zones",
      endemicBody:
        "Regions where hantavirus circulates long-term — derived from strain reservoir data. Purple markers.",
      disclaimer:
        "Informational only. Signals can be incomplete or delayed — always cross-check with official health authorities. We never invent or impute counts.",
      cta: "Got it — explore the map",
    },
    languagePickerLabel: "Language",
  },
  es: {
    welcome: {
      title: "Bienvenida a HantaWatch",
      subtitle: "Una vista basada en señales del hantavirus — qué esperar",
      activeTitle: "Alertas activas",
      activeBody:
        "Señales recientes de brotes desde el Boletín de Brotes de la OMS. Marcadores rojos pulsantes — estas son las zonas calientes ahora mismo.",
      historicalTitle: "Reportes históricos",
      historicalBody:
        "Conteo acumulado de casos publicado por CDC NNDSS, con desglose por estado de EE. UU. Marcadores ámbar, tamaño según carga de casos.",
      endemicTitle: "Zonas endémicas",
      endemicBody:
        "Regiones donde el hantavirus circula a largo plazo — derivadas de los datos del reservorio de cada cepa. Marcadores morados.",
      disclaimer:
        "Solo informativo. Las señales pueden ser incompletas o tardías — verifica siempre con las autoridades sanitarias oficiales. No inventamos ni imputamos cifras.",
      cta: "Entendido — explorar el mapa",
    },
    languagePickerLabel: "Idioma",
  },
  pt: {
    welcome: {
      title: "Bem-vindo ao HantaWatch",
      subtitle: "Uma visão baseada em sinais do hantavírus — o que esperar",
      activeTitle: "Alertas ativos",
      activeBody:
        "Sinais recentes de surtos do Boletim de Surtos da OMS. Marcadores vermelhos pulsantes — são as zonas críticas no momento.",
      historicalTitle: "Relatórios históricos",
      historicalBody:
        "Contagem cumulativa de casos publicada pelo CDC NNDSS, com detalhamento por estado dos EUA. Marcadores âmbar, dimensionados pela carga de casos.",
      endemicTitle: "Zonas endêmicas",
      endemicBody:
        "Regiões onde o hantavírus circula a longo prazo — derivadas dos dados do reservatório de cada cepa. Marcadores roxos.",
      disclaimer:
        "Apenas informativo. Os sinais podem estar incompletos ou atrasados — sempre confirme com as autoridades de saúde oficiais. Nunca inventamos ou imputamos contagens.",
      cta: "Entendido — explorar o mapa",
    },
    languagePickerLabel: "Idioma",
  },
};

const STORAGE_KEY = "hw-locale-v1";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "es" || stored === "pt") return stored;
  // Auto-detect from browser
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("pt")) return "pt";
  return "en";
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}
