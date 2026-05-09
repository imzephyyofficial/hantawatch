"use client";

import type { MapMarker } from "./live-map";

interface Props {
  visible: Set<MapMarker["tier"]>;
  setVisible: (next: Set<MapMarker["tier"]>) => void;
  counts: Record<MapMarker["tier"], number>;
}

const TIERS: Array<{ tier: MapMarker["tier"]; label: string; sub: string; color: string }> = [
  { tier: "active", label: "Active alerts", sub: "Currently flagged by WHO DON", color: "#ef4444" },
  { tier: "historical", label: "Historical reporting", sub: "CDC NNDSS · CDC cumulative", color: "#f59e0b" },
  { tier: "endemic", label: "Endemic zones", sub: "Long-term reservoir presence", color: "#a855f7" },
];

export function LayerPanel({ visible, setVisible, counts }: Props) {
  const toggle = (tier: MapMarker["tier"]) => {
    const next = new Set(visible);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    setVisible(next);
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-[280px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90 backdrop-blur-md p-3 shadow-2xl">
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-fg-muted)] mb-2">
        Layers
      </div>
      <ul className="space-y-1.5">
        {TIERS.map((t) => {
          const on = visible.has(t.tier);
          return (
            <li key={t.tier}>
              <button
                type="button"
                onClick={() => toggle(t.tier)}
                aria-pressed={on}
                className={`w-full flex items-start gap-2.5 text-left px-2 py-1.5 rounded-lg transition-colors ${
                  on ? "bg-[var(--color-bg-hover)]" : "opacity-60 hover:opacity-100"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                  style={{ background: t.color, boxShadow: on ? `0 0 8px ${t.color}` : "none" }}
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium leading-tight">
                    {t.label}{" "}
                    <span className="text-[10px] font-mono text-[var(--color-fg-muted)] ml-1">
                      {counts[t.tier] ?? 0}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-muted)] leading-tight">{t.sub}</div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-[var(--color-fg-muted)] mt-2.5 leading-snug border-t border-[var(--color-border-soft)] pt-2">
        Number on a marker = case count where reported. Sized log-scaled.
      </p>
    </div>
  );
}
