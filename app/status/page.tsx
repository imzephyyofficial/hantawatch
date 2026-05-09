import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dataSources } from "@/lib/data";
import { fetchLive } from "@/lib/sources";
import { fmt, fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Status",
  description: "Live data freshness and component status of HantaWatch.",
};

export const revalidate = 21600;

export default async function Page() {
  const { countries, events, sources, fetchedAt } = await fetchLive();
  const lastReports = countries.map((r) => r.lastReport).sort();
  const oldest = lastReports[0];
  const newest = lastReports[lastReports.length - 1];

  return (
    <>
      <Topbar
        title="Status"
        subtitle="Live data freshness and component health"
        snapshotDate={newest}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">Last live fetch</div>
          <div className="text-base font-semibold">{new Date(fetchedAt).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" })}</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Cached at the edge for 6h</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">Reporting span</div>
          <div className="text-base font-semibold">
            {oldest ? `${fmtDate(oldest)} → ${fmtDate(newest)}` : "—"}
          </div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Across all live country rows</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-fg-muted)] mb-2">Coverage</div>
          <div className="text-base font-semibold font-mono tabular-nums">
            {fmt(countries.length)} countries · {fmt(events.length)} events
          </div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Live entries from upstream sources</div>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold mb-4">Sources</h3>
        <ul className="space-y-3">
          {sources.map((s) => (
            <Row
              key={s.source}
              label={s.source === "WHO" ? "WHO Disease Outbreak News" : "CDC Hantavirus surveillance"}
              status={s.ok ? "ok" : "warn"}
              detail={s.detail ?? "—"}
            />
          ))}
        </ul>
      </Card>

      <Card className="mb-6">
        <h3 className="font-semibold mb-4">Components</h3>
        <ul className="space-y-3">
          <Row label="Dashboard rendering" status="ok" detail="Static + ISR (6h revalidate)" />
          <Row label="Daily cron (/api/cron/refresh)" status="ok" detail="06:00 UTC · revalidates dashboard, outbreaks, /api/v1/live" />
          <Row label="Public API v1" status="ok" detail="/api/v1/{countries,outbreaks,strains,metrics,live}" />
          <Row label="Atom feed" status="ok" detail="/api/rss/outbreaks" />
          <Row label="ECDC adapter" status="planned" detail="Phase 2 · annual epi report (PDF or HTML)" />
          <Row label="PAHO adapter" status="planned" detail="Phase 2 · regional reports + Epi Alerts" />
          <Row label="Database (Neon Postgres)" status="planned" detail="Phase 2 · provision in Vercel Marketplace" />
          <Row label="Auth & subscriptions" status="planned" detail="Phase 5 · Clerk + Resend" />
        </ul>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Source documents</h3>
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
