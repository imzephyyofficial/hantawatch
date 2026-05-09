"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cfr, fmt, fmtCfr, fmtDate } from "@/lib/format";
import { riskScore } from "@/lib/risk";
import type { SurveillanceRecord, Status } from "@/lib/types";

const STATUS_BADGE: Record<Status, BadgeVariant> = {
  active: "active",
  outbreak: "outbreak",
  monitored: "monitored",
};

interface Props {
  initial: string[];
  all: SurveillanceRecord[];
}

export function CompareClient({ initial, all }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [selected, setSelected] = useState<string[]>(initial.length > 0 ? initial : ["us", "ar", "fi"]);

  const rows = useMemo(
    () => selected.map((iso) => all.find((r) => r.iso === iso)).filter(Boolean) as SurveillanceRecord[],
    [selected, all]
  );

  const updateUrl = (next: string[]) => {
    const params = new URLSearchParams(search.toString());
    if (next.length > 0) params.set("c", next.join(","));
    else params.delete("c");
    router.replace(`/compare${params.toString() ? "?" + params.toString() : ""}`);
  };

  const toggle = (iso: string) => {
    const next = selected.includes(iso) ? selected.filter((s) => s !== iso) : [...selected, iso].slice(0, 4);
    setSelected(next);
    updateUrl(next);
  };

  return (
    <>
      <Card className="mb-6">
        <p className="text-sm text-[var(--color-fg-muted)] mb-3">Tap up to 4 countries:</p>
        <div className="flex flex-wrap gap-1.5">
          {all.map((r) => (
            <button
              key={r.iso}
              type="button"
              onClick={() => toggle(r.iso)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selected.includes(r.iso)
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)]"
              }`}
            >
              {r.flag} {r.country}
            </button>
          ))}
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p className="text-center py-12 text-[var(--color-fg-muted)]">Pick at least one country above.</p>
        </Card>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}
        >
          {rows.map((r) => {
            const pct = cfr(r.deaths, r.cases);
            const risk = riskScore(r);
            return (
              <Card key={r.iso} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(r.iso)}
                  aria-label={`Remove ${r.country}`}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-fg-muted)]"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="text-3xl mb-2">{r.flag}</div>
                <h3 className="text-lg font-bold mb-1">{r.country}</h3>
                <p className="text-xs text-[var(--color-fg-muted)] mb-4">{r.region}</p>

                <KV label="Cases" value={fmt(r.cases)} mono />
                <KV label="Deaths" value={fmt(r.deaths)} mono />
                <KV
                  label="CFR"
                  value={fmtCfr(pct)}
                  mono
                  accent={pct >= 20 ? "danger" : pct >= 5 ? "warn" : "success"}
                />
                <KV label="Strain" value={r.strain} />
                <KV label="Last report" value={fmtDate(r.lastReport)} />
                <KV label="Status" value={<Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>} />
                <KV
                  label="Risk score"
                  value={
                    <span className="font-mono">
                      {risk.score} <span className="text-xs text-[var(--color-fg-muted)]">({risk.tier})</span>
                    </span>
                  }
                />

                <Link
                  href={`/country/${r.iso}`}
                  className="block mt-4 text-center text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  Country page →
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 flex gap-2">
          <Button onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy share link</Button>
        </div>
      )}
    </>
  );
}

function KV({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: "danger" | "warn" | "success";
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-soft)] last:border-b-0 gap-2">
      <span className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)] font-semibold">{label}</span>
      <span
        className={`text-sm font-medium text-right ${mono ? "font-mono tabular-nums" : ""} ${
          accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : accent === "success" ? "text-emerald-400" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
