import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent: "danger" | "warn" | "purple" | "brand" | "success" | "amber" | "cyan";
}

const ACCENTS: Record<Props["accent"], { ring: string; text: string; glow: string }> = {
  danger:  { ring: "border-red-500/30",     text: "text-red-400",     glow: "shadow-[0_0_60px_-20px_rgba(239,68,68,0.6)]" },
  warn:    { ring: "border-amber-500/30",   text: "text-amber-400",   glow: "shadow-[0_0_60px_-20px_rgba(245,158,11,0.6)]" },
  purple:  { ring: "border-purple-500/30",  text: "text-purple-400",  glow: "shadow-[0_0_60px_-20px_rgba(168,85,247,0.6)]" },
  brand:   { ring: "border-blue-500/30",    text: "text-blue-400",    glow: "shadow-[0_0_60px_-20px_rgba(59,130,246,0.6)]" },
  success: { ring: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-[0_0_60px_-20px_rgba(34,197,94,0.6)]" },
  amber:   { ring: "border-amber-500/30",   text: "text-amber-300",   glow: "shadow-[0_0_60px_-20px_rgba(252,211,77,0.6)]" },
  cyan:    { ring: "border-cyan-500/30",    text: "text-cyan-400",    glow: "shadow-[0_0_60px_-20px_rgba(6,182,212,0.6)]" },
};

export function BigCounter({ label, value, sub, accent }: Props) {
  const a = ACCENTS[accent];
  return (
    <div
      className={cn(
        "rounded-xl border bg-black/30 backdrop-blur-md p-5 lg:p-6",
        "transition-transform hover:-translate-y-0.5",
        a.ring,
        a.glow
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-fg-muted)] mb-2.5">
        {label}
      </div>
      <div
        className={cn(
          "text-4xl lg:text-5xl xl:text-6xl font-extrabold tabular-nums leading-none tracking-tight font-mono",
          a.text
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2.5 text-xs text-[var(--color-fg-muted)] leading-tight">
          {sub}
        </div>
      )}
    </div>
  );
}
