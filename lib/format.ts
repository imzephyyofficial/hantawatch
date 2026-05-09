export const fmt = (n: number) => n.toLocaleString("en-US");

export const cfr = (deaths: number, cases: number) =>
  cases === 0 ? 0 : (deaths / cases) * 100;

export const fmtCfr = (pct: number) =>
  (pct < 1 ? pct.toFixed(2) : pct.toFixed(1)) + "%";

export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export const cfrTier = (pct: number): "low" | "mid" | "high" =>
  pct >= 20 ? "high" : pct >= 5 ? "mid" : "low";

export const cfrColor = (pct: number) => {
  const tier = cfrTier(pct);
  return tier === "high" ? "var(--color-danger)" : tier === "mid" ? "var(--color-warn)" : "var(--color-success)";
};
