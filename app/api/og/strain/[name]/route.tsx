import { ImageResponse } from "next/og";
import { strains } from "@/lib/data";

export const runtime = "edge";

const slug = (s: string) => s.toLowerCase().replace(/[ /]/g, "-");

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const s = strains.find((x) => slug(x.name) === name);
  if (!s) return new ImageResponse(<div style={{ display: "flex" }}>Not found</div>, { width: 1200, height: 630 });
  const sevColor = s.syndrome === "HCPS" ? "#ef4444" : "#3b82f6";

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
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 64 }}>🦠</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 800 }}>{s.name} virus</div>
            <div style={{ fontSize: 18, color: "#9ca3af" }}>{s.family}</div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "10px 20px",
              borderRadius: 999,
              background: `${sevColor}26`,
              color: sevColor,
              fontSize: 18,
              fontWeight: 700,
              border: `2px solid ${sevColor}`,
            }}
          >
            {s.syndrome}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <Row k="Reservoir" v={s.reservoir} />
          <Row k="CFR range" v={`${s.cfrRange[0]}–${s.cfrRange[1]}%`} />
          <Row k="Range" v={s.geographicRange.slice(0, 4).join(" · ")} />
        </div>

        <div style={{ fontSize: 18, color: "#d1d5db", lineHeight: 1.5, maxWidth: 980, display: "flex" }}>
          {s.description.length > 220 ? s.description.slice(0, 217) + "…" : s.description}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 16, color: "#9ca3af" }}>
          <span>HantaWatch · Strain reference</span>
          <span>hantawatch-global.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 16, fontSize: 22 }}>
      <div style={{ width: 160, color: "#9ca3af", textTransform: "uppercase", fontSize: 14, letterSpacing: 2, paddingTop: 6 }}>
        {k}
      </div>
      <div style={{ color: "#f9fafb", fontWeight: 500 }}>{v}</div>
    </div>
  );
}
