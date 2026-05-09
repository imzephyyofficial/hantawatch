"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  FileText,
  GitCompare,
  LayoutDashboard,
  Menu,
  Search,
  ShieldAlert,
  Siren,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { outbreaks } from "@/lib/metrics";

const NAV = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, match: ["/", "/dashboard"] },
  { href: "/surveillance", label: "Surveillance", Icon: Search, match: ["/surveillance"] },
  { href: "/outbreaks", label: "Outbreaks", Icon: Siren, match: ["/outbreaks"], badge: true },
  { href: "/risk", label: "Risk index", Icon: ShieldAlert, match: ["/risk"] },
  { href: "/compare", label: "Compare", Icon: GitCompare, match: ["/compare"] },
  { href: "/analytics", label: "Analytics", Icon: BarChart3, match: ["/analytics"] },
  { href: "/reports", label: "Reports", Icon: FileText, match: ["/reports"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const outbreakCount = outbreaks().length;

  const isActive = (matches: string[]) =>
    matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed top-4 left-4 z-50 lg:hidden",
          "w-10 h-10 inline-flex items-center justify-center rounded-lg",
          "bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px]",
          "bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]",
          "flex flex-col py-6 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-6 pb-6 border-b border-[var(--color-border-soft)]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xl">
            🦠
          </div>
          <div>
            <div className="text-base font-bold leading-tight">HantaWatch</div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)] font-semibold">
              Global Surveillance
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 pt-6 flex flex-col gap-0.5" aria-label="Primary">
          {NAV.map(({ href, label, Icon, match, badge }) => {
            const active = isActive(match);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-500 text-white"
                    : "text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {badge && outbreakCount > 0 && (
                  <span
                    className={cn(
                      "ml-auto px-2 rounded-full text-[10px] font-bold min-w-[20px] text-center",
                      active ? "bg-white/25" : "bg-red-500 text-white"
                    )}
                  >
                    {outbreakCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pt-4 border-t border-[var(--color-border-soft)] flex items-center justify-between text-[11px] text-[var(--color-fg-muted)]">
          <span>v4.0.0</span>
          <Link href="/status" className="hover:text-[var(--color-fg)]">
            status
          </Link>
        </div>
      </aside>
    </>
  );
}
