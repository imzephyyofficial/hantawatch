"use client";

import { useEffect, useState } from "react";
import { X, Activity, Shield, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hw-welcomed-v1";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Defer to next tick so the map paints first
      const id = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(id);
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-[var(--color-border-soft)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🦠</span>
              <h2 id="welcome-title" className="text-lg font-bold">Welcome to HantaWatch</h2>
            </div>
            <p className="text-sm text-[var(--color-fg-muted)]">A signal-based view on hantavirus — what to expect</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close welcome"
            className="p-1.5 rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Tier
            icon={<Activity className="h-5 w-5 text-red-400" />}
            title="Active alerts"
            body="Recent outbreak signals from WHO Disease Outbreak News. Pulsing red markers — these are the hot zones right now."
          />
          <Tier
            icon={<BarChart3 className="h-5 w-5 text-amber-400" />}
            title="Historical reporting"
            body="Cumulative case counts published by CDC NNDSS, with US state-level breakdowns. Amber markers, sized by case load."
          />
          <Tier
            icon={<Shield className="h-5 w-5 text-purple-400" />}
            title="Endemic zones"
            body="Regions where hantavirus circulates long-term — derived from strain reservoir data. Purple markers."
          />

          <div className="flex gap-2 items-start text-xs text-[var(--color-fg-muted)] bg-[var(--color-bg-tertiary)] p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Informational only. Signals can be incomplete or delayed — always cross-check with official health authorities. We never invent or impute counts.
            </span>
          </div>
        </div>

        <div className="p-5 pt-0 flex justify-end gap-2">
          <Button variant="primary" onClick={dismiss} className="w-full">
            Got it — explore the map
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tier({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-[var(--color-fg-muted)] leading-relaxed mt-0.5">{body}</div>
      </div>
    </div>
  );
}
