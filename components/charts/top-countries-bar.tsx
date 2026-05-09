"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  data: Array<{ country: string; flag: string; cases: number }>;
}

export function TopCountriesBar({ data }: Props) {
  const formatted = data.map((d) => ({
    label: `${d.flag} ${d.country}`,
    cases: d.cases,
  }));
  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" horizontal={false} />
          <XAxis type="number" stroke="var(--color-fg-muted)" fontSize={11} />
          <YAxis type="category" dataKey="label" stroke="var(--color-fg-secondary)" fontSize={11} width={150} />
          <Tooltip />
          <Bar dataKey="cases" fill="#a855f7" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
