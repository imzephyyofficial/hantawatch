import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";

const CfrStrainBar = dynamic(() => import("@/components/charts/cfr-strain-bar").then((m) => m.CfrStrainBar), {
  loading: () => <div className="h-[300px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading chart…</div>,
});
const RegionBar = dynamic(() => import("@/components/charts/region-bar").then((m) => m.RegionBar), {
  loading: () => <div className="h-[300px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading chart…</div>,
});
const TopCountriesBar = dynamic(() => import("@/components/charts/top-countries-bar").then((m) => m.TopCountriesBar), {
  loading: () => <div className="h-[420px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading chart…</div>,
});
import { fetchLive } from "@/lib/sources";
import { regionCfr, regionTotals, snapshotDate, strainAggregates, topCountries, totalCases } from "@/lib/metrics";
import { fmtCfr } from "@/lib/format";
import { AlertCircle, Earth, Microscope } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Strain, region, and country-level breakdowns derived from live data.",
};

export const revalidate = 21600;

export default async function Page() {
  const { countries } = await fetchLive();
  const strainsAgg = strainAggregates(countries).filter((s) => s.cases > 0);
  const regions = regionTotals(countries).filter((r) => r.cases > 0);
  const top = topCountries(countries, 10);
  const americasCfr = regionCfr(countries, "Americas");
  const europeCfr = regionCfr(countries, "Europe");
  const asiaTotal = regions.find((r) => r.region === "Asia")?.cases ?? 0;
  const totalCasesNum = totalCases(countries);
  const asiaShare = totalCasesNum > 0 ? (asiaTotal / totalCasesNum) * 100 : 0;
  const deadliest = strainsAgg.length > 0 ? [...strainsAgg].sort((a, b) => b.cfr - a.cfr)[0] : null;

  const haveAnyCases = totalCasesNum > 0;
  const americasVsEurope = americasCfr != null && europeCfr != null && europeCfr > 0
    ? (americasCfr / europeCfr).toFixed(1)
    : null;

  return (
    <>
      <Topbar
        title="Analytics"
        subtitle="Strain, region, and country-level breakdowns derived from live data"
        snapshotDate={snapshotDate(countries)}
      />

      {haveAnyCases ? (
        <Card className="mb-6">
          <Insight
            icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
            title={
              americasVsEurope
                ? `Americas CFR is ${americasVsEurope}× higher than Europe`
                : americasCfr != null
                  ? `Americas average CFR is ${fmtCfr(americasCfr)}`
                  : "CFR not computable for either region"
            }
            body={`Americas average ${fmtCfr(americasCfr)} vs. Europe ${fmtCfr(europeCfr)} — derived from countries currently in the live set.`}
          />
          <Insight
            icon={<Earth className="h-5 w-5 text-blue-400" />}
            title={`Asia accounts for ${asiaShare.toFixed(0)}% of reported cases in the live set`}
            body="Aggregated from countries with published case counts. Coverage is intentionally narrow — only what live sources publish."
          />
          {deadliest && (
            <Insight
              icon={<Microscope className="h-5 w-5 text-purple-400" />}
              title={`${deadliest.name} has the highest reported CFR — ${fmtCfr(deadliest.cfr)}`}
              body={`${deadliest.cases.toLocaleString()} cases and ${deadliest.deaths.toLocaleString()} deaths across ${deadliest.countries} countries.`}
              isLast
            />
          )}
        </Card>
      ) : (
        <Card className="mb-6">
          <p className="text-sm text-[var(--color-fg-muted)] py-4">
            No country in the current live set has both case and death counts published. Insights will populate when WHO or CDC publishes new figures.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>CFR by strain</CardTitle>
              <CardSubtitle>Average case fatality rate per strain group</CardSubtitle>
            </div>
          </CardHeader>
          {strainsAgg.length > 0 ? (
            <CfrStrainBar data={strainsAgg} />
          ) : (
            <div className="text-sm text-[var(--color-fg-muted)] py-12 text-center">No strain-level case data in the live set yet.</div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cases by region</CardTitle>
              <CardSubtitle>Aggregated totals from the live set</CardSubtitle>
            </div>
          </CardHeader>
          {regions.length > 0 ? (
            <RegionBar data={regions} />
          ) : (
            <div className="text-sm text-[var(--color-fg-muted)] py-12 text-center">No regions with case figures.</div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top countries by reported cases</CardTitle>
            <CardSubtitle>Live ranking — countries without published counts are not shown</CardSubtitle>
          </div>
        </CardHeader>
        {top.length > 0 ? (
          <TopCountriesBar data={top} />
        ) : (
          <div className="text-sm text-[var(--color-fg-muted)] py-12 text-center">No countries in the live set have published case counts.</div>
        )}
      </Card>
    </>
  );
}

function Insight({ icon, title, body, isLast = false }: { icon: React.ReactNode; title: string; body: string; isLast?: boolean }) {
  return (
    <div className={`flex gap-3 py-3 ${isLast ? "" : "border-b border-[var(--color-border-soft)]"}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="font-semibold text-sm mb-0.5">{title}</div>
        <div className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
