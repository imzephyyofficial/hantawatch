"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ForecastResult } from "@/lib/forecast";

interface Props {
  region: string;
  data: ForecastResult;
}

export function ForecastChart({ region, data }: Props) {
  const histLen = data.history.length;
  const merged = [
    ...data.history.map((v, i) => ({ x: i + 1, history: v, forecast: null as number | null })),
    ...data.forecast.map((v, i) => ({ x: histLen + i + 1, history: null as number | null, forecast: v })),
  ];
  // bridge point so the dashed line connects to the last history point
  if (merged.length > 0 && histLen > 0) {
    merged[histLen] = { ...merged[histLen], forecast: data.history[histLen - 1] };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-[var(--color-fg-muted)]">
          Trend {data.trendPerWeek > 0 ? "+" : ""}{data.trendPerWeek}/wk · R²&nbsp;{data.rSquared}
        </span>
        <span className="text-[var(--color-fg-muted)]">{region}</span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
            <XAxis dataKey="x" stroke="var(--color-fg-muted)" fontSize={10} />
            <YAxis stroke="var(--color-fg-muted)" fontSize={10} />
            <Tooltip />
            <ReferenceLine x={histLen} stroke="var(--color-fg-muted)" strokeDasharray="2 2" label={{ value: "now", fontSize: 10, fill: "var(--color-fg-muted)" }} />
            <Line type="monotone" dataKey="history" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
