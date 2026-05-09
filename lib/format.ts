export const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Case fatality rate. Returns null when either input is null/missing —
 * coercing nulls to zero would silently produce "0% CFR" for countries
 * that simply don't publish death counts.
 */
export const cfr = (deaths: number | null | undefined, cases: number | null | undefined): number | null => {
  if (deaths == null || cases == null || cases === 0) return null;
  return (deaths / cases) * 100;
};

export const fmtCfr = (pct: number | null) =>
  pct == null ? "—" : (pct < 1 ? pct.toFixed(2) : pct.toFixed(1)) + "%";

/** Relative time in plain English. */
export function fmtRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  const diffMo = Math.round(diffDay / 30);
  return `${diffMo} mo ago`;
}

export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export const cfrTier = (pct: number): "low" | "mid" | "high" =>
  pct >= 20 ? "high" : pct >= 5 ? "mid" : "low";

export const cfrColor = (pct: number | null) => {
  if (pct == null) return "var(--color-fg-muted)";
  const tier = cfrTier(pct);
  return tier === "high" ? "var(--color-danger)" : tier === "mid" ? "var(--color-warn)" : "var(--color-success)";
};
