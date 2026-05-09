import type { BreakdownRow } from "@/lib/sources";
import type { CaseBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface Props {
  rows: BreakdownRow[];
  totals: CaseBreakdown;
}

const COLS: Array<{ key: keyof CaseBreakdown; label: string; accent: string }> = [
  { key: "reported", label: "Reported", accent: "text-red-400" },
  { key: "confirmed", label: "Confirmed", accent: "text-amber-400" },
  { key: "probable", label: "Probable", accent: "text-amber-300" },
  { key: "hospitalized", label: "Hospitalized", accent: "text-cyan-400" },
  { key: "critical", label: "Critical", accent: "text-cyan-300" },
  { key: "deceased", label: "Deceased", accent: "text-purple-400" },
  { key: "recovered", label: "Recovered", accent: "text-emerald-400" },
];

const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-US"));

export function SourceBreakdownTable({ rows, totals }: Props) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-[var(--color-bg-tertiary)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] px-4 py-3 whitespace-nowrap">
                Source
              </th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="bg-[var(--color-bg-tertiary)] text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] px-4 py-3 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + 1} className="px-4 py-8 text-center text-[var(--color-fg-muted)]">
                  Live sources returned no rows.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.source} className="border-b border-[var(--color-border-soft)]">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                          {r.source} <ExternalLink className="inline h-3 w-3 ml-0.5" />
                        </a>
                      ) : (
                        r.source
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">{r.scope}</div>
                  </td>
                  {COLS.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 text-right font-mono tabular-nums",
                        r.breakdown[c.key] != null ? c.accent : "text-[var(--color-fg-muted)]"
                      )}
                    >
                      {fmt(r.breakdown[c.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-[var(--color-bg-tertiary)]/50">
                <td className="px-4 py-3 font-semibold text-sm">Total</td>
                {COLS.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 text-right font-mono tabular-nums font-bold",
                      totals[c.key] != null ? c.accent : "text-[var(--color-fg-muted)]"
                    )}
                  >
                    {fmt(totals[c.key])}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
