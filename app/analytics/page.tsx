import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { CfrStrainBar } from "@/components/charts/cfr-strain-bar";
import { RegionBar } from "@/components/charts/region-bar";
import { TopCountriesBar } from "@/components/charts/top-countries-bar";
import { regionCfr, regionTotals, strainAggregates, topCountries, totalCases } from "@/lib/metrics";
import { fmtCfr } from "@/lib/format";
import { AlertCircle, Earth, Microscope } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Strain, region, and country-level breakdowns of hantavirus surveillance data.",
};

export default function Page() {
  const strains = strainAggregates();
  const regions = regionTotals();
  const top = topCountries(10);
  const americasCfr = regionCfr("Americas");
  const europeCfr = regionCfr("Europe");
  const asiaShare = (regions.find((r) => r.region === "Asia")?.cases ?? 0) / Math.max(totalCases(), 1) * 100;
  const deadliest = [...strains].sort((a, b) => b.cfr - a.cfr)[0];

  return (
    <>
      <Topbar title="Analytics" subtitle="Strain, region, and country-level breakdowns" />

      <Card className="mb-6">
        <Insight
          icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
          title={`Americas CFR is ${(americasCfr / Math.max(europeCfr, 0.01)).toFixed(0)}× higher than Europe`}
          body={`Americas average ${fmtCfr(americasCfr)} vs. Europe ${fmtCfr(europeCfr)} — driven by Andes and Sin Nombre virus mortality.`}
        />
        <Insight
          icon={<Earth className="h-5 w-5 text-blue-400" />}
          title={`Asia accounts for ${asiaShare.toFixed(0)}% of global cases`}
          body="Hantaan and Seoul virus circulation in China dominates the global case count, with most cases recovering."
        />
        {deadliest && (
          <Insight
            icon={<Microscope className="h-5 w-5 text-purple-400" />}
            title={`${deadliest.name} has the highest CFR — ${fmtCfr(deadliest.cfr)}`}
            body={`${deadliest.cases.toLocaleString()} cases and ${deadliest.deaths.toLocaleString()} deaths across ${deadliest.countries} countries.`}
            isLast
          />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>CFR by strain</CardTitle>
              <CardSubtitle>Average case fatality rate per strain group</CardSubtitle>
            </div>
          </CardHeader>
          <CfrStrainBar data={strains} />
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cases by region</CardTitle>
              <CardSubtitle>Aggregated totals by WHO region</CardSubtitle>
            </div>
          </CardHeader>
          <RegionBar data={regions} />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top 10 countries by cases</CardTitle>
            <CardSubtitle>Cumulative reported cases (2025–2026)</CardSubtitle>
          </div>
        </CardHeader>
        <TopCountriesBar data={top} />
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
