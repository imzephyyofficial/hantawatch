import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { fetchLive } from "@/lib/sources";
import { allRiskScores, type RiskScore } from "@/lib/risk";
import { snapshotDate } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Risk index",
  description: "Composite risk score per country combining live case load, CFR, per-capita rate, recency, and outbreak status.",
};

export const revalidate = 21600;

const TIER_BADGE: Record<RiskScore["tier"], BadgeVariant> = {
  high: "outbreak",
  elevated: "warn",
  moderate: "monitored",
  low: "active",
};

export default async function Page() {
  const { countries } = await fetchLive();
  const scores = allRiskScores(countries);
  return (
    <>
      <Topbar
        title="Risk index"
        subtitle="Composite signal: WHO/CDC reporting · CFR · per-capita rate · recency"
        snapshotDate={snapshotDate(countries)}
      />

      <Card className="mb-6">
        <p className="text-sm text-[var(--color-fg-secondary)]">
          Composite of: case load (log-scaled where published), CFR (where both
          cases and deaths are published), per-million population rate, days
          since last report, and a status floor (outbreak &gt; active &gt;
          monitored). Higher = more concerning. Directional only — not a
          clinical or policy tool.
        </p>
      </Card>

      {scores.length === 0 ? (
        <Card>
          <p className="text-center py-12 text-[var(--color-fg-muted)]">No countries in the live set.</p>
        </Card>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["#", "Country", "Region", "Score", "Tier", "Cases", "CFR", "Per capita", "Recency"].map((h) => (
                    <th key={h} className="bg-[var(--color-bg-tertiary)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={s.iso} className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-hover)] last:border-b-0">
                    <td className="px-4 py-3 text-[var(--color-fg-muted)] font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/country/${s.iso}`} className="hover:text-blue-400">
                        {s.flag} {s.country}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{s.region}</td>
                    <td className="px-4 py-3 font-mono font-bold text-base">{s.score}</td>
                    <td className="px-4 py-3"><Badge variant={TIER_BADGE[s.tier]}>{s.tier}</Badge></td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)] font-mono">{s.drivers.cases}</td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)] font-mono">{s.drivers.cfr}</td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)] font-mono">{s.drivers.perCapita}</td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)] font-mono">{s.drivers.recency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
