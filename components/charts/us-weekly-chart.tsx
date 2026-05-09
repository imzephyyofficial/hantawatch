"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  data: Array<{ year: number; week: number; hps: number; nonHps: number }>;
}

export function UsWeeklyChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: `${d.year}-W${String(d.week).padStart(2, "0")}`,
    HPS: d.hps,
    "Non-HPS infection": d.nonHps,
  }));
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
          <XAxis dataKey="label" stroke="var(--color-fg-muted)" fontSize={11} angle={-30} textAnchor="end" height={60} />
          <YAxis stroke="var(--color-fg-muted)" fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="HPS" stackId="a" fill="#ef4444" />
          <Bar dataKey="Non-HPS infection" stackId="a" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
