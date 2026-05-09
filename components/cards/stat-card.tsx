import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  meta?: ReactNode;
  icon: ReactNode;
  accent: "danger" | "warn" | "purple" | "brand" | "success";
}

const accentClasses: Record<StatCardProps["accent"], string> = {
  danger: "bg-red-500/15 text-red-400",
  warn: "bg-amber-500/15 text-amber-400",
  purple: "bg-purple-500/15 text-purple-400",
  brand: "bg-blue-500/15 text-blue-400",
  success: "bg-emerald-500/15 text-emerald-400",
};

export function StatCard({ title, value, meta, icon, accent }: StatCardProps) {
  return (
    <Card className="hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
          {title}
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accentClasses[accent])}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-extrabold tracking-tight font-mono mb-1.5 tabular-nums">
        {value}
      </div>
      <div className="text-sm text-[var(--color-fg-muted)]">{meta}</div>
    </Card>
  );
}
