"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  BarChart3,
  Database,
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

const NAV = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, match: ["/", "/dashboard"] },
  { href: "/surveillance", label: "Surveillance", Icon: Search, match: ["/surveillance"] },
  { href: "/outbreaks", label: "Outbreaks", Icon: Siren, match: ["/outbreaks"] },
  { href: "/risk", label: "Risk index", Icon: ShieldAlert, match: ["/risk"] },
  { href: "/compare", label: "Compare", Icon: GitCompare, match: ["/compare"] },
  { href: "/analytics", label: "Analytics", Icon: BarChart3, match: ["/analytics"] },
  { href: "/sources", label: "Data sources", Icon: Database, match: ["/sources"] },
  { href: "/reports", label: "Reports", Icon: FileText, match: ["/reports"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

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
          "fixed lg:sticky top-0 left-0 z-40 h-screen",
          // Mobile drawer: 280px. Tablet (lg–xl): 72px icons-only. Desktop (xl+): 260px.
          "w-[280px] lg:w-[72px] xl:w-[260px]",
          "bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]",
          "flex flex-col py-6 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 lg:px-4 xl:px-6 pb-6 border-b border-[var(--color-border-soft)]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xl flex-shrink-0">
            🦠
          </div>
          <div className="lg:hidden xl:block">
            <div className="text-base font-bold leading-tight">HantaWatch</div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)] font-semibold">
              Global Surveillance
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 lg:px-2 xl:px-3 pt-6 flex flex-col gap-0.5" aria-label="Primary">
          {NAV.map(({ href, label, Icon, match }) => {
            const active = isActive(match);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                title={label}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  "px-4 py-2.5 lg:px-3 lg:py-2.5 lg:justify-center xl:px-4 xl:justify-start",
                  active
                    ? "bg-blue-500 text-white"
                    : "text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg)]"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="lg:hidden xl:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 lg:px-2 xl:px-6 pt-4 mb-4 border-t border-[var(--color-border-soft)] flex items-center justify-between gap-2 min-h-[40px]">
          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="text-xs text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)] font-medium">
                <span className="lg:hidden xl:inline">Sign in</span>
                <span className="hidden lg:inline xl:hidden">↪</span>
              </button>
            </SignInButton>
          )}
          {isLoaded && isSignedIn && (
            <>
              <Link href="/account" className="text-xs text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)] font-medium" title="Account">
                <span className="lg:hidden xl:inline">Account</span>
                <span className="hidden lg:inline xl:hidden">⚙</span>
              </Link>
              <UserButton />
            </>
          )}
        </div>

        <div className="px-6 lg:px-2 xl:px-6 pt-4 border-t border-[var(--color-border-soft)] flex items-center justify-between text-[11px] text-[var(--color-fg-muted)] lg:flex-col lg:items-center lg:gap-2 xl:flex-row xl:items-center">
          <span>v4.0.0</span>
          <Link href="/status" className="hover:text-[var(--color-fg)]" title="System status">
            <span className="lg:hidden xl:inline">status</span>
            <span className="hidden lg:inline xl:hidden">●</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
