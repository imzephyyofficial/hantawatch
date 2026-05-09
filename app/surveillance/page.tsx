import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { SurveillanceTable } from "@/components/surveillance-table";
import { surveillanceData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Country Surveillance",
  description: "Sortable, filterable view of all tracked countries with cases, deaths, CFR, strain, and status.",
};

export default function Page() {
  return (
    <>
      <Topbar
        title="Country Surveillance"
        subtitle="Sortable, filterable view of all tracked countries"
      />
      <SurveillanceTable data={surveillanceData} />
    </>
  );
}
