"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyTimeline } from "@/lib/types";
import { cn } from "@/lib/utils";

type Series = "all" | "americas" | "europe" | "asia";

interface Props {
  data: WeeklyTimeline;
}

const COLORS = {
  americas: "#ef4444",
  europe: "#3b82f6",
  asia: "#a855f7",
} as const;

export function TimelineChart({ data }: Props) {
  const [series, setSeries] = useState<Series>("all");

  const chartData = data.labels.map((label, i) => ({
    label: label.slice(5),
    Americas: data.americas[i],
    Europe: data.europe[i],
    Asia: data.asia[i],
  }));

  const buttons: Array<{ value: Series; label: string }> = [
    { value: "all", label: "All regions" },
    { value: "americas", label: "Americas" },
    { value: "europe", label: "Europe" },
    { value: "asia", label: "Asia" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {buttons.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => setSeries(b.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              series === b.value
                ? "bg-blue-500 border-blue-500 text-white"
                : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)]"
            )}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {series === "all" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis dataKey="label" stroke="var(--color-fg-muted)" fontSize={11} />
              <YAxis stroke="var(--color-fg-muted)" fontSize={11} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Asia" stackId="1" stroke={COLORS.asia} fill={COLORS.asia} fillOpacity={0.2} />
              <Area type="monotone" dataKey="Europe" stackId="1" stroke={COLORS.europe} fill={COLORS.europe} fillOpacity={0.2} />
              <Area type="monotone" dataKey="Americas" stackId="1" stroke={COLORS.americas} fill={COLORS.americas} fillOpacity={0.2} />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis dataKey="label" stroke="var(--color-fg-muted)" fontSize={11} />
              <YAxis stroke="var(--color-fg-muted)" fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={series === "americas" ? "Americas" : series === "europe" ? "Europe" : "Asia"}
                stroke={COLORS[series]}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
