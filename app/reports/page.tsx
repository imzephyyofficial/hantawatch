import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Reports",
  description: "Export current snapshots in CSV or JSON, or generate a printable view.",
};

export default function Page() {
  return (
    <>
      <Topbar title="Reports" subtitle="Export snapshots and generate printable views" />
      <ReportsClient />
    </>
  );
}
