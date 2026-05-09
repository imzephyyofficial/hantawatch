import { ImageResponse } from "next/og";
import { outbreakEvents } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const runtime = "edge";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ev = outbreakEvents.find((e) => e.id === id);
  if (!ev) return new ImageResponse(<div style={{ display: "flex" }}>Not found</div>, { width: 1200, height: 630 });
  const sevColor = ev.severity === "high" ? "#ef4444" : ev.severity === "medium" ? "#f59e0b" : "#3b82f6";

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
          borderLeft: `12px solid ${sevColor}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 56 }}>{ev.flag}</div>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: `${sevColor}26`,
              color: sevColor,
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              border: `2px solid ${sevColor}`,
            }}
          >
            {ev.severity} severity
          </div>
          <div style={{ marginLeft: "auto", fontSize: 18, color: "#9ca3af" }}>{fmtDate(ev.date)}</div>
        </div>

        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, maxWidth: 980 }}>
          {ev.title}
        </div>

        <div style={{ fontSize: 22, color: "#d1d5db", lineHeight: 1.5, maxWidth: 980, display: "flex" }}>
          {ev.body.length > 200 ? ev.body.slice(0, 197) + "…" : ev.body}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 16, color: "#9ca3af" }}>
          <span>HantaWatch · Outbreak alert</span>
          <span>{ev.country}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
