import type { Metadata } from "next";
import Link from "next/link";
import { fetchLive } from "@/lib/sources";
import { fetchResearch } from "@/lib/sources/research";
import { fmtDate } from "@/lib/format";
import { MapClient } from "./map-client";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "Live signal map",
  description: "Pulsing map of current hantavirus signals — WHO Disease Outbreak News, CDC NNDSS state-level reporting, endemic zones, with a live publication feed.",
};

export const revalidate = 21600;

export default async function MapPage() {
  const [{ countries, events, usWeekly, fetchedAt }, research] = await Promise.all([
    fetchLive(),
    fetchResearch(),
  ]);

  const stateRows = usWeekly.ok ? usWeekly.stateRows : [];
  const publications = research.publications.recentPapers;
  const preprints = research.preprints.recent;

  const totalSignals = events.length + publications.length + preprints.length;
  const flaggedCountries = countries.filter((c) => c.status === "outbreak").length;
  const lead = events[0];

  return (
    <div className="relative h-[calc(100vh-4rem)] lg:h-screen -mx-4 lg:-mx-6 xl:-mx-8 -my-6 lg:-my-8 overflow-hidden">
      {/* top stat strip — sits over the map, mirrors the topbar look */}
      <div className="absolute top-0 left-0 right-0 lg:right-[360px] z-10 px-4 lg:px-6 py-3 bg-gradient-to-b from-[var(--color-bg)] to-transparent pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 max-w-full pointer-events-auto">
          <Badge variant="success" pulse>
            <Radio className="h-3 w-3" />
            Live · {countries.length} countr{countries.length === 1 ? "y" : "ies"}
          </Badge>
          <Badge variant="brand">
            {totalSignals} signals
          </Badge>
          {flaggedCountries > 0 && (
            <Badge variant="outbreak">
              {flaggedCountries} flagged
            </Badge>
          )}
          {lead && (
            <Link
              href={`/outbreaks/${lead.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-secondary)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-md border border-[var(--color-border)] rounded-full px-3 py-1 hover:text-[var(--color-fg)] hover:border-[var(--color-border-soft)]"
            >
              <span>{lead.flag}</span>
              <span className="font-medium truncate max-w-[260px]">{lead.title}</span>
              {lead.breakdown?.deceased != null && lead.breakdown.reported != null && (
                <span className="text-red-400 font-mono text-[11px] flex-shrink-0">
                  {lead.breakdown.deceased}† · {lead.breakdown.reported} cases
                </span>
              )}
              <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
            </Link>
          )}
          <span className="text-[11px] text-[var(--color-fg-muted)] ml-auto">
            Snapshot {fmtDate(fetchedAt.slice(0, 10))}
          </span>
        </div>
      </div>

      <MapClient
        countries={countries}
        events={events}
        stateRows={stateRows}
        publications={publications}
        preprints={preprints}
        fetchedAt={fetchedAt}
      />
    </div>
  );
}
