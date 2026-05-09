import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-[var(--color-bg-tertiary)] text-[var(--color-fg-secondary)] border-[var(--color-border)]",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  outbreak: "bg-red-500/15 text-red-400 border-red-500/30",
  monitored: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  brand: "bg-blue-500/15 text-blue-400 border-blue-500/30",
} as const;

export type BadgeVariant = keyof typeof variants;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

export function Badge({ className, variant = "default", pulse = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border",
        variants[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
