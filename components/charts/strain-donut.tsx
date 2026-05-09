"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StrainAggregate } from "@/lib/types";

const PALETTE = ["#ef4444", "#3b82f6", "#a855f7", "#f59e0b", "#22c55e", "#06b6d4"];

interface Props {
  data: StrainAggregate[];
}

export function StrainDonut({ data }: Props) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="cases" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={1}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 11, color: "var(--color-fg-secondary)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
