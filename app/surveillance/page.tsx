import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { SurveillanceTable } from "@/components/surveillance-table";
import { fetchLive } from "@/lib/sources";
import { snapshotDate } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Country Surveillance",
  description: "Live, sortable, filterable view of countries currently reporting hantavirus activity.",
};

export const revalidate = 21600;

export default async function Page() {
  const { countries } = await fetchLive();
  return (
    <>
      <Topbar
        title="Country Surveillance"
        subtitle={`${countries.length} countr${countries.length === 1 ? "y" : "ies"} with live signals`}
        snapshotDate={snapshotDate(countries)}
      />
      <SurveillanceTable data={countries} />
    </>
  );
}
