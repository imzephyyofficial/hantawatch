"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { SurveillanceRecord, Status } from "@/lib/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cfr, cfrTier, fmt, fmtCfr, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "country" | "region" | "cases" | "deaths" | "cfr" | "strain" | "lastReport" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = Status | "all";

const STATUS_BADGE: Record<Status, BadgeVariant> = {
  active: "active",
  outbreak: "outbreak",
  monitored: "monitored",
};

interface Props {
  data: SurveillanceRecord[];
}

export function SurveillanceTable({ data }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "cases", dir: "desc" });

  const rows = useMemo(() => {
    let r = data.slice();
    if (status !== "all") r = r.filter((x) => x.status === status);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          x.country.toLowerCase().includes(q) ||
          x.strain.toLowerCase().includes(q) ||
          x.region.toLowerCase().includes(q) ||
          x.status.toLowerCase().includes(q)
      );
    }
    const mul = sort.dir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      const av = sort.key === "cfr" ? cfr(a.deaths, a.cases) : (a[sort.key] as string | number);
      const bv = sort.key === "cfr" ? cfr(b.deaths, b.cases) : (b[sort.key] as string | number);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv)) * mul;
    });
    return r;
  }, [data, search, status, sort]);

  const toggle = (key: SortKey) => {
    setSort((s) => {
      if (s.key === key) return { key, dir: s.dir === "asc" ? "desc" : "asc" };
      return { key, dir: ["country", "region", "strain", "lastReport", "status"].includes(key) ? "asc" : "desc" };
    });
  };

  const exportData = (format: "csv" | "json") => {
    if (format === "json") {
      const blob = new Blob(
        [JSON.stringify(rows.map((r) => ({ ...r, cfrPct: +cfr(r.deaths, r.cases).toFixed(2) })), null, 2)],
        { type: "application/json" }
      );
      downloadBlob(blob, "hantawatch-surveillance.json");
      return;
    }
    const cols = ["Country", "Region", "Cases", "Deaths", "CFR (%)", "Strain", "Last Report", "Status"];
    const csv = [
      cols.join(","),
      ...rows.map((r) =>
        [r.country, r.region, r.cases, r.deaths, cfr(r.deaths, r.cases).toFixed(2), r.strain, r.lastReport, r.status]
          .map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v))
          .join(",")
      ),
    ].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), "hantawatch-surveillance.csv");
  };

  const headers: Array<{ key: SortKey; label: string }> = [
    { key: "country", label: "Country" },
    { key: "region", label: "Region" },
    { key: "cases", label: "Cases" },
    { key: "deaths", label: "Deaths" },
    { key: "cfr", label: "CFR" },
    { key: "strain", label: "Strain" },
    { key: "lastReport", label: "Last report" },
    { key: "status", label: "Status" },
  ];

  return (
    <div>
      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country, strain, region…"
            aria-label="Search surveillance"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
          {(["all", "outbreak", "active", "monitored"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                status === s
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)]"
              )}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => exportData("csv")}>⬇ CSV</Button>
          <Button onClick={() => exportData("json")}>⬇ JSON</Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {headers.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggle(key)}
                    aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className="bg-[var(--color-bg-tertiary)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] cursor-pointer select-none whitespace-nowrap hover:text-[var(--color-fg)]"
                  >
                    {label}
                    <span className={cn("ml-1.5 text-[10px]", sort.key === key ? "text-blue-400" : "opacity-50")}>
                      {sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--color-fg-muted)]">
                    <div className="text-2xl mb-2 opacity-60">🔎</div>
                    No matches for the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const pct = cfr(r.deaths, r.cases);
                  const tier = cfrTier(pct);
                  return (
                    <tr key={r.iso} className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-hover)] last:border-b-0">
                      <td className="px-4 py-3.5">
                        <Link href={`/country/${r.iso}`} className="hover:text-blue-400">
                          <span aria-hidden>{r.flag}</span> {r.country}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--color-fg-secondary)]">{r.region}</td>
                      <td className="px-4 py-3.5 font-mono tabular-nums">{fmt(r.cases)}</td>
                      <td className="px-4 py-3.5 font-mono tabular-nums">{fmt(r.deaths)}</td>
                      <td
                        className={cn(
                          "px-4 py-3.5 font-mono tabular-nums font-semibold",
                          tier === "high" && "text-red-400",
                          tier === "mid" && "text-amber-400",
                          tier === "low" && "text-emerald-400"
                        )}
                      >
                        {fmtCfr(pct)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/strain/${r.strain.replace(/ \(imported\)/i, "").toLowerCase().replace(/[ /]/g, "-")}`} className="hover:text-blue-400">
                          {r.strain}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--color-fg-secondary)]">{fmtDate(r.lastReport)}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--color-fg-muted)]">
        Showing {rows.length} of {data.length} countries · sorted by {sort.key} {sort.dir}
      </p>
    </div>
  );
}

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
