"use client";

import { useEffect, useState } from "react";
import { X, Activity, Shield, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALES, STRINGS, getStoredLocale, setStoredLocale, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "hw-welcomed-v1";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLocale(getStoredLocale());
    if (!localStorage.getItem(STORAGE_KEY)) {
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

  const handleLocaleChange = (next: Locale) => {
    setLocale(next);
    setStoredLocale(next);
  };

  if (!open) return null;

  const t = STRINGS[locale].welcome;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-[var(--color-border-soft)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🦠</span>
              <h2 id="welcome-title" className="text-lg font-bold">{t.title}</h2>
            </div>
            <p className="text-sm text-[var(--color-fg-muted)]">{t.subtitle}</p>
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
            title={t.activeTitle}
            body={t.activeBody}
          />
          <Tier
            icon={<BarChart3 className="h-5 w-5 text-amber-400" />}
            title={t.historicalTitle}
            body={t.historicalBody}
          />
          <Tier
            icon={<Shield className="h-5 w-5 text-purple-400" />}
            title={t.endemicTitle}
            body={t.endemicBody}
          />

          <div className="flex gap-2 items-start text-xs text-[var(--color-fg-muted)] bg-[var(--color-bg-tertiary)] p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{t.disclaimer}</span>
          </div>
        </div>

        <div className="p-5 pt-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex gap-1 sm:order-1 order-2">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLocaleChange(l.code)}
                aria-label={`${STRINGS[locale].languagePickerLabel}: ${l.nativeName}`}
                aria-pressed={locale === l.code}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${
                  locale === l.code
                    ? "bg-blue-500 text-white"
                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                }`}
              >
                {l.code}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={dismiss} className="flex-1 sm:order-2 order-1">
            {t.cta}
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
