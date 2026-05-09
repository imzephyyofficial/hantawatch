"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { surveillanceData } from "@/lib/data";
import { strainAggregates } from "@/lib/metrics";
import { cfr } from "@/lib/format";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const reports = [
  {
    title: "Country surveillance — full",
    description: "All tracked countries with cases, deaths, CFR, strain, and status.",
    actions: [
      {
        label: "Download CSV",
        kind: "primary" as const,
        run: () => {
          const cols = ["Country", "Region", "Cases", "Deaths", "CFR (%)", "Strain", "Last Report", "Status"];
          const csv = [
            cols.join(","),
            ...surveillanceData.map((r) =>
              [r.country, r.region, r.cases, r.deaths, cfr(r.deaths, r.cases).toFixed(2), r.strain, r.lastReport, r.status]
                .map(csvEscape)
                .join(",")
            ),
          ].join("\n");
          downloadBlob(new Blob([csv], { type: "text/csv" }), "hantawatch-surveillance.csv");
        },
      },
      {
        label: "Download JSON",
        kind: "default" as const,
        run: () => {
          const data = surveillanceData.map((r) => ({ ...r, cfrPct: +cfr(r.deaths, r.cases).toFixed(2) }));
          downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "hantawatch-surveillance.json");
        },
      },
    ],
  },
  {
    title: "Active outbreaks brief",
    description: "Subset filtered to countries currently classified as outbreak.",
    actions: [
      {
        label: "Download CSV",
        kind: "primary" as const,
        run: () => {
          const items = surveillanceData.filter((r) => r.status === "outbreak");
          const cols = ["Country", "Region", "Cases", "Deaths", "CFR (%)", "Strain", "Last Report"];
          const csv = [
            cols.join(","),
            ...items.map((r) =>
              [r.country, r.region, r.cases, r.deaths, cfr(r.deaths, r.cases).toFixed(2), r.strain, r.lastReport]
                .map(csvEscape)
                .join(",")
            ),
          ].join("\n");
          downloadBlob(new Blob([csv], { type: "text/csv" }), "hantawatch-outbreaks.csv");
        },
      },
    ],
  },
  {
    title: "Strain summary",
    description: "Aggregated cases, deaths, and average CFR per strain.",
    actions: [
      {
        label: "Download CSV",
        kind: "primary" as const,
        run: () => {
          const groups = strainAggregates();
          const cols = ["Strain", "Cases", "Deaths", "CFR (%)", "Countries"];
          const csv = [
            cols.join(","),
            ...groups.map((g) => [g.name, g.cases, g.deaths, g.cfr.toFixed(2), g.countries].map(csvEscape).join(",")),
          ].join("\n");
          downloadBlob(new Blob([csv], { type: "text/csv" }), "hantawatch-strains.csv");
        },
      },
    ],
  },
  {
    title: "Printable snapshot",
    description: "Print-friendly view of every section in this dashboard.",
    actions: [
      {
        label: "Open print dialog",
        kind: "primary" as const,
        run: () => window.print(),
      },
    ],
  },
];

export function ReportsClient() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((r) => (
        <Card key={r.title} className="flex flex-col gap-3">
          <h3 className="font-semibold">{r.title}</h3>
          <p className="text-sm text-[var(--color-fg-muted)] flex-1">{r.description}</p>
          <div className="flex gap-2 flex-wrap">
            {r.actions.map((a) => (
              <Button key={a.label} variant={a.kind === "primary" ? "primary" : "default"} onClick={a.run}>
                {a.label}
              </Button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
