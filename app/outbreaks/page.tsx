import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { AlertFeed } from "@/components/alert-feed";
import { Radio, ExternalLink } from "lucide-react";
import { outbreaks } from "@/lib/metrics";
import { outbreakEvents } from "@/lib/data";
import { cfr, fmt, fmtCfr, fmtDate } from "@/lib/format";
import { fetchWhoLive } from "@/lib/live";
import type { Status } from "@/lib/types";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Active Outbreaks",
  description: "Countries currently classified as outbreak and recent outbreak events worldwide.",
};

const STATUS_BADGE: Record<Status, BadgeVariant> = {
  active: "active",
  outbreak: "outbreak",
  monitored: "monitored",
};

export default async function Page() {
  const active = outbreaks();
  const live = await fetchWhoLive();

  return (
    <>
      <Topbar title="Active Outbreaks" subtitle="Countries currently classified outbreak and recent events" />

      {live.events.length > 0 && (
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400" /> WHO Disease Outbreak News
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)]">
                {live.events.length} live entr{live.events.length === 1 ? "y" : "ies"} · refreshed {fmtDate(live.fetchedAt.slice(0, 10))}
              </p>
            </div>
            <a href="https://www.who.int/emergencies/disease-outbreak-news" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              View at WHO <ExternalLink className="inline h-3 w-3" />
            </a>
          </div>
          <AlertFeed events={live.events} linkable={false} />
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Active outbreaks</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Countries with status &quot;outbreak&quot; in the current snapshot</p>
          </div>
        </div>

        {active.length === 0 ? (
          <Card>
            <p className="text-center text-[var(--color-fg-muted)] py-12">
              <span className="text-2xl block mb-2">✓</span>
              No countries currently classified as outbreak.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((r) => {
              const pct = cfr(r.deaths, r.cases);
              return (
                <Card key={r.iso} className="border-l-[3px] border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden>{r.flag}</span>
                      <div>
                        <CardTitle>{r.country}</CardTitle>
                        <CardSubtitle>
                          {r.region} · {r.strain}
                        </CardSubtitle>
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                  </CardHeader>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Stat label="Cases" value={fmt(r.cases)} />
                    <Stat label="Deaths" value={fmt(r.deaths)} />
                    <Stat label="CFR" value={fmtCfr(pct)} />
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mb-3">
                    Last reported: {fmtDate(r.lastReport)}
                  </div>
                  <Link
                    href={`/country/${r.iso}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    Country deep-dive →
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Event timeline</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Recent surveillance signals (most recent first)</p>
          </div>
        </div>
        <AlertFeed events={outbreakEvents} />
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
