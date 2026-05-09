import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SurveillanceTable } from "@/components/surveillance-table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLive } from "@/lib/sources";
import { snapshotDate } from "@/lib/metrics";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Country Surveillance",
  description: "Live, sortable, filterable view of countries currently reporting hantavirus activity.",
};

export const revalidate = 21600;

export default async function Page() {
  const { countries, events, fetchedAt } = await fetchLive();
  const multiCountryEvent = events.find((e) => e.country === "Multi-country");

  return (
    <>
      <Topbar
        title="Country Surveillance"
        subtitle={`${countries.length} countr${countries.length === 1 ? "y" : "ies"} with live signals`}
        snapshotDate={snapshotDate(countries)}
        relativeFetch={fetchedAt}
      />

      {multiCountryEvent && (
        <Card className="mb-6 border-l-[3px] border-l-amber-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-bold">Multi-country event</h3>
                <Badge variant="warn">why some countries show "—"</Badge>
              </div>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                <strong>{multiCountryEvent.title}</strong> ({fmtDate(multiCountryEvent.date)}) lists multiple
                countries as involved, but WHO does not publish per-country case counts in this DON entry. Those
                countries appear below with cases = "—" because we don&rsquo;t fabricate values when the source
                is silent. The event total is{" "}
                {multiCountryEvent.breakdown?.reported ?? "—"} cases globally, including{" "}
                {multiCountryEvent.breakdown?.deceased ?? "—"} deaths.
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <Link href={`/outbreaks/${multiCountryEvent.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                  Event detail →
                </Link>
                <a href={multiCountryEvent.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-fg-muted)] hover:text-blue-400">
                  Read at WHO <ExternalLink className="inline h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      <SurveillanceTable data={countries} />
    </>
  );
}
