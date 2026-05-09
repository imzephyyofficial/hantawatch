import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { snapshotDate } from "@/lib/metrics";
import { surveillanceData, dataSources } from "@/lib/data";
import { fmt, fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Status",
  description: "Data freshness and operational state of the HantaWatch dashboard.",
};

export default function Page() {
  const snapshot = snapshotDate();
  const lastReports = surveillanceData
    .map((r) => r.lastReport)
    .sort()
    .reverse();
  const oldest = lastReports[lastReports.length - 1];
  const newest = lastReports[0];

  return (
    <>
      <Topbar title="Status" subtitle="Data freshness and system operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">Snapshot date</div>
          <div className="text-xl font-bold">{fmtDate(snapshot)}</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Most recent country report in dataset</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">Reporting span</div>
          <div className="text-base font-semibold">{fmtDate(oldest)} → {fmtDate(newest)}</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Across all countries</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">Records tracked</div>
          <div className="text-xl font-bold font-mono tabular-nums">{fmt(surveillanceData.length)}</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Country-level entries</div>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold mb-4">Components</h3>
        <ul className="space-y-3">
          <Row label="Dashboard rendering" status="ok" detail="Static + ISR" />
          <Row label="Data layer (snapshot)" status="ok" detail="Bundled fixtures · no live ETL yet" />
          <Row label="Data ingestion (cron)" status="planned" detail="Phase 2 · cron to WHO/CDC/ECDC/PAHO" />
          <Row label="Database" status="planned" detail="Phase 2 · Neon Postgres" />
          <Row label="Auth & subscriptions" status="planned" detail="Phase 5 · Clerk + Resend" />
          <Row label="Public API" status="planned" detail="Phase 8 · /api/v1/*" />
        </ul>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Source links</h3>
        <ul className="space-y-2 text-sm">
          {dataSources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {s.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Row({ label, status, detail }: { label: string; status: "ok" | "planned" | "warn"; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-[var(--color-border-soft)] last:border-b-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[var(--color-fg-muted)]">{detail}</div>
      </div>
      <Badge variant={status === "ok" ? "success" : status === "warn" ? "warn" : "default"}>
        {status === "ok" ? "Operational" : status === "warn" ? "Degraded" : "Planned"}
      </Badge>
    </li>
  );
}
