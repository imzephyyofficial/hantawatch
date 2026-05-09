"use client";

import { geoEqualEarth, geoPath } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { CountrySnapshot } from "@/lib/sources";
import type { Status } from "@/lib/types";
import Link from "next/link";

const ISO_NUMERIC: Record<string, string> = {
  ar: "032", au: "036", at: "040", be: "056", bo: "068", br: "076", ca: "124",
  cl: "152", cn: "156", co: "170", cz: "203", cv: "132", dk: "208", ee: "233",
  fi: "246", fr: "250", de: "276", gr: "300", hu: "348", is: "352", ie: "372",
  it: "380", jp: "392", kr: "410", kz: "398", lv: "428", lt: "440", lu: "442",
  mx: "484", nl: "528", no: "578", py: "600", pe: "604", pl: "616", pt: "620",
  ro: "642", ru: "643", rs: "688", sk: "703", si: "705", za: "710", es: "724",
  se: "752", ch: "756", tr: "792", ua: "804", gb: "826", us: "840", uy: "858",
  ve: "862",
};

const STATUS_COLORS: Record<Status, string> = {
  outbreak: "#ef4444",
  active: "#3b82f6",
  monitored: "#a855f7",
};

interface Props {
  data: CountrySnapshot[];
}

interface Geo extends Feature<Geometry, { name: string }> {
  id: string;
}

export function WorldMap({ data }: Props) {
  const [geos, setGeos] = useState<Geo[] | null>(null);
  const [hover, setHover] = useState<{ name: string; record?: CountrySnapshot; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((topology) => {
        const fc = feature(topology, topology.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
        setGeos(fc.features as Geo[]);
      })
      .catch(() => setGeos([]));
  }, []);

  const numericToRecord = useMemo(() => {
    const map = new Map<string, CountrySnapshot>();
    for (const r of data) {
      const num = ISO_NUMERIC[r.iso];
      if (num) map.set(num, r);
    }
    return map;
  }, [data]);

  const projection = geoEqualEarth().scale(155).translate([480, 250]);
  const path = geoPath(projection);

  if (!geos) {
    return (
      <div className="h-[480px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">
        Loading world map…
      </div>
    );
  }
  if (geos.length === 0) {
    return (
      <div className="h-[480px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">
        Map data unavailable.
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: "960 / 500" }}>
      <svg viewBox="0 0 960 500" className="w-full h-full" role="img" aria-label="Live hantavirus activity map">
        <rect width="960" height="500" fill="transparent" />
        {geos.map((g) => {
          const numeric = String(g.id).padStart(3, "0");
          const record = numericToRecord.get(numeric);
          const fill = record?.status ? STATUS_COLORS[record.status] : "var(--color-bg-tertiary)";
          const opacity = record ? 0.85 : 0.55;
          const d = path(g);
          if (!d) return null;
          return (
            <path
              key={String(g.id)}
              d={d}
              fill={fill}
              fillOpacity={opacity}
              stroke="var(--color-border)"
              strokeWidth={0.5}
              style={{ cursor: record ? "pointer" : "default" }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGPathElement).ownerSVGElement?.getBoundingClientRect();
                if (!rect) return;
                setHover({ name: g.properties.name, record, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      {hover && (
        <div
          className="absolute pointer-events-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(hover.x + 12, 600), top: hover.y + 12 }}
        >
          <div className="font-semibold mb-0.5">
            {hover.record?.flag ?? ""} {hover.record?.country ?? hover.name}
          </div>
          {hover.record ? (
            <>
              <div className="text-[var(--color-fg-muted)]">
                {hover.record.cases != null ? `${hover.record.cases.toLocaleString()} cases` : "no case figure"}
                {hover.record.deaths != null ? ` · ${hover.record.deaths.toLocaleString()} deaths` : ""}
              </div>
              <div className="text-[var(--color-fg-muted)]">
                {hover.record.strain ?? "strain unspecified"} · {hover.record.source}
              </div>
            </>
          ) : (
            <div className="text-[var(--color-fg-muted)]">No reported activity</div>
          )}
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-3 bg-[var(--color-bg-secondary)]/80 backdrop-blur px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs">
        <LegendDot color={STATUS_COLORS.outbreak} label="Outbreak" />
        <LegendDot color={STATUS_COLORS.active} label="Active" />
        <LegendDot color={STATUS_COLORS.monitored} label="Monitored" />
      </div>
      {hover?.record && (
        <Link
          href={`/country/${hover.record.iso}`}
          className="absolute top-2 right-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          View {hover.record.country} →
        </Link>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="text-[var(--color-fg-secondary)]">{label}</span>
    </span>
  );
}
