import { ImageResponse } from "next/og";
import { totalCases, totalDeaths, outbreaks, overallCfr, snapshotDate } from "@/lib/metrics";
import { fmt, fmtCfr } from "@/lib/format";

export const runtime = "edge";

export async function GET() {
  const cases = totalCases();
  const deaths = totalDeaths();
  const ob = outbreaks().length;
  const cfrPct = overallCfr();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg,#0a0f1a 0%,#0f172a 50%,#0a0f1a 100%)",
          color: "#f9fafb",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div style={{ fontSize: 64 }}>🦠</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>HantaWatch</div>
            <div style={{ fontSize: 18, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2 }}>
              Global Hantavirus Surveillance
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, flex: 1, alignItems: "center" }}>
          <Cell label="Cases" value={fmt(cases)} color="#ef4444" />
          <Cell label="Outbreaks" value={String(ob)} color="#f59e0b" />
          <Cell label="Deaths" value={fmt(deaths)} color="#a855f7" />
          <Cell label="CFR" value={fmtCfr(cfrPct)} color="#3b82f6" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, fontSize: 18, color: "#9ca3af" }}>
          <span>Snapshot · {snapshotDate()}</span>
          <span>hantawatch-global.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "rgba(31,41,55,0.7)",
        border: "1px solid rgba(75,85,99,0.5)",
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div style={{ fontSize: 16, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
