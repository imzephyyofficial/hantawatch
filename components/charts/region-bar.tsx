"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  data: Array<{ region: string; cases: number }>;
}

export function RegionBar({ data }: Props) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
          <XAxis dataKey="region" stroke="var(--color-fg-muted)" fontSize={11} />
          <YAxis stroke="var(--color-fg-muted)" fontSize={11} />
          <Tooltip />
          <Bar dataKey="cases" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
