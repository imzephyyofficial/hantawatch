"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StrainAggregate } from "@/lib/types";
import { cfrColor } from "@/lib/format";

interface Props {
  data: StrainAggregate[];
}

export function CfrStrainBar({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.cfr - a.cfr).map((d) => ({ ...d, cfr: +d.cfr.toFixed(1) }));
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" horizontal={false} />
          <XAxis type="number" stroke="var(--color-fg-muted)" fontSize={11} unit="%" />
          <YAxis type="category" dataKey="name" stroke="var(--color-fg-secondary)" fontSize={11} width={120} />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Bar dataKey="cfr" radius={[0, 6, 6, 0]}>
            {sorted.map((d, i) => (
              <Cell key={i} fill={cfrColor(d.cfr)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
