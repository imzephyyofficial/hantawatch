import { ImageResponse } from "next/og";
import { surveillanceData } from "@/lib/data";
import { cfr, fmt, fmtCfr } from "@/lib/format";
import { riskScore } from "@/lib/risk";

export const runtime = "edge";

export async function GET(_req: Request, ctx: { params: Promise<{ iso: string }> }) {
  const { iso } = await ctx.params;
  const r = surveillanceData.find((x) => x.iso === iso);
  if (!r) {
    return new ImageResponse(<div style={{ display: "flex" }}>Not found</div>, { width: 1200, height: 630 });
  }
  const pct = cfr(r.deaths, r.cases);
  const risk = riskScore(r);
  const accent = r.status === "outbreak" ? "#ef4444" : r.status === "active" ? "#3b82f6" : "#a855f7";

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
          padding: "56px 72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div style={{ fontSize: 80 }}>{r.flag}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 800 }}>{r.country}</div>
            <div style={{ fontSize: 20, color: "#9ca3af" }}>
              {r.region} · {r.strain}
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "10px 20px",
              borderRadius: 999,
              background: `${accent}26`,
              color: accent,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              border: `2px solid ${accent}`,
            }}
          >
            {r.status}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <Cell label="Cases" value={fmt(r.cases)} color="#f9fafb" />
          <Cell label="Deaths" value={fmt(r.deaths)} color="#a855f7" />
          <Cell label="CFR" value={fmtCfr(pct)} color={pct >= 20 ? "#ef4444" : pct >= 5 ? "#f59e0b" : "#22c55e"} />
          <Cell label="Risk score" value={String(risk.score)} color="#3b82f6" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 18, color: "#9ca3af" }}>
          <span>HantaWatch · Global Surveillance</span>
          <span>hantawatch-global.vercel.app/country/{r.iso}</span>
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
        padding: "20px 24px",
      }}
    >
      <div style={{ fontSize: 14, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 44, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
