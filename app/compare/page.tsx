import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CompareClient } from "./compare-client";
import { surveillanceData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Compare countries",
  description: "Compare 2–4 countries side-by-side on cases, deaths, CFR, strain, and risk score.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const requested = (sp.c ?? "").split(",").filter(Boolean).slice(0, 4);
  return (
    <>
      <Topbar title="Compare countries" subtitle="Pick 2–4 countries to stack their metrics side-by-side" />
      <CompareClient initial={requested} all={surveillanceData} />
    </>
  );
}
