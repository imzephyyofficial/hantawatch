import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CompareClient } from "./compare-client";
import { fetchLive } from "@/lib/sources";
import { snapshotDate } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Compare countries",
  description: "Compare live country data side-by-side: cases, deaths, CFR, strain, and risk score.",
};

export const revalidate = 21600;

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const requested = (sp.c ?? "").split(",").filter(Boolean).slice(0, 4);
  const { countries } = await fetchLive();
  return (
    <>
      <Topbar
        title="Compare countries"
        subtitle="Stack 2–4 countries from the live set side-by-side"
        snapshotDate={snapshotDate(countries)}
      />
      <CompareClient initial={requested} all={countries} />
    </>
  );
}
