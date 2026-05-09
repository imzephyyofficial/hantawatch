import type { Metadata } from "next";
import Link from "next/link";
import { Radio, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { AlertFeed } from "@/components/alert-feed";
import { fetchLive } from "@/lib/sources";
import { snapshotDate, outbreakRows } from "@/lib/metrics";
import { cfr, fmt, fmtCfr, fmtDate } from "@/lib/format";
import type { Status } from "@/lib/types";

export const metadata: Metadata = {
  title: "Active Outbreaks",
  description: "Live WHO Disease Outbreak News entries plus countries currently flagged.",
};

export const revalidate = 21600;

const STATUS_BADGE: Record<Status, BadgeVariant> = {
  active: "active",
  outbreak: "outbreak",
  monitored: "monitored",
};

export default async function Page() {
  const { countries, events, fetchedAt } = await fetchLive();
  const flagged = outbreakRows(countries);

  return (
    <>
      <Topbar
        title="Active Outbreaks"
        subtitle="Live WHO Disease Outbreak News + countries flagged in current entries"
        snapshotDate={snapshotDate(countries)}
      />

      <section className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" /> WHO Disease Outbreak News
            </h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Live · {events.length} entr{events.length === 1 ? "y" : "ies"} · last fetch {fmtDate(fetchedAt.slice(0, 10))}
            </p>
          </div>
          <a href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300">
            WHO source <ExternalLink className="inline h-3 w-3" />
          </a>
        </div>
        {events.length > 0 ? (
          <AlertFeed events={events} />
        ) : (
          <Card>
            <p className="text-center text-[var(--color-fg-muted)] py-12">
              <span className="text-2xl block mb-2">✓</span>
              No active hantavirus DON entries from WHO right now.
            </p>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Countries currently flagged</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Listed in the most recent WHO entry</p>
          </div>
        </div>

        {flagged.length === 0 ? (
          <Card>
            <p className="text-center text-[var(--color-fg-muted)] py-12">No countries currently flagged.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flagged.map((r) => {
              const pct = r.cases != null && r.deaths != null ? cfr(r.deaths, r.cases) : null;
              return (
                <Card key={r.iso} className="border-l-[3px] border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden>{r.flag}</span>
                      <div>
                        <CardTitle>{r.country}</CardTitle>
                        <CardSubtitle>{r.region} · {r.strain ?? "Strain TBD"}</CardSubtitle>
                      </div>
                    </div>
                    {r.status && <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>}
                  </CardHeader>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Stat label="Cases" value={r.cases != null ? fmt(r.cases) : "—"} />
                    <Stat label="Deaths" value={r.deaths != null ? fmt(r.deaths) : "—"} />
                    <Stat label="CFR" value={pct != null ? fmtCfr(pct) : "—"} />
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mb-3">
                    Listed {fmtDate(r.lastReport)} via{" "}
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      {r.source}
                    </a>
                  </div>
                  <Link href={`/country/${r.iso}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    Country page →
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] mb-0.5">{label}</div>
      <div className="font-mono font-semibold text-base">{value}</div>
    </div>
  );
}
