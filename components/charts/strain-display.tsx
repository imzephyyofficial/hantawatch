"use client";

import dynamic from "next/dynamic";
import type { StrainAggregate } from "@/lib/types";
import Link from "next/link";

const StrainDonut = dynamic(() => import("./strain-donut").then((m) => m.StrainDonut), {
  ssr: false,
  loading: () => <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading chart…</div>,
});

interface Props {
  data: StrainAggregate[];
}

const slug = (s: string) => s.toLowerCase().replace(/[ /]/g, "-");

/**
 * A single-slice donut is visually broken. When there's only one strain
 * with cases, render a stat card instead. Once two+ strains report,
 * fall through to the donut.
 */
export function StrainDisplay({ data }: Props) {
  const withCases = data.filter((d) => d.cases > 0);

  if (withCases.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-sm text-[var(--color-fg-muted)] px-6 text-center">
        <div className="text-3xl mb-2 opacity-50">🦠</div>
        Awaiting per-strain case counts from live sources.
      </div>
    );
  }

  if (withCases.length === 1) {
    const only = withCases[0];
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-center px-6">
        <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-[var(--color-fg-muted)] mb-3">
          Sole reported strain
        </div>
        <div className="text-5xl font-extrabold font-mono tabular-nums text-red-400 mb-1">
          {only.cases.toLocaleString("en-US")}
        </div>
        <div className="text-base font-semibold mb-4">{only.name} virus</div>
        <Link
          href={`/strain/${slug(only.name)}`}
          className="text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          Strain reference →
        </Link>
      </div>
    );
  }

  return <StrainDonut data={withCases} />;
}
