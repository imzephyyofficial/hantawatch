import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ReportsClient } from "./reports-client";
import { fetchLive } from "@/lib/sources";
import { snapshotDate, strainAggregates } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Reports",
  description: "Export the live snapshot in CSV or JSON, or generate a printable view.",
};

export const revalidate = 21600;

export default async function Page() {
  const { countries } = await fetchLive();
  const strains = strainAggregates(countries);
  return (
    <>
      <Topbar
        title="Reports"
        subtitle="Export current live snapshot or generate a printable view"
        snapshotDate={snapshotDate(countries)}
      />
      <ReportsClient countries={countries} strains={strains} />
    </>
  );
}
