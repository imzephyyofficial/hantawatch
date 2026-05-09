"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  series: Array<{ article: string; daily: Array<{ date: string; views: number }> }>;
}

export function PageviewsChart({ series }: Props) {
  // Aggregate daily across all articles for a single trend line
  const byDate = new Map<string, number>();
  for (const s of series) {
    for (const d of s.daily) {
      byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.views);
    }
  }
  const data = Array.from(byDate.entries())
    .sort()
    .map(([date, views]) => ({ date: date.slice(5), views }));

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
          <XAxis dataKey="date" stroke="var(--color-fg-muted)" fontSize={11} interval={Math.max(0, Math.floor(data.length / 12))} />
          <YAxis stroke="var(--color-fg-muted)" fontSize={11} />
          <Tooltip />
          <Area type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2} fill="url(#pvGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
