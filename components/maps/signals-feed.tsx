"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { OutbreakEvent } from "@/lib/types";
import { fmtRelative, fmtDate } from "@/lib/format";

export interface FeedItem {
  id: string;
  kind: "outbreak" | "publication" | "preprint";
  title: string;
  body?: string;
  source: string;
  date: string;       // ISO
  url?: string;
  flag?: string;
  country?: string;
}

interface Props {
  items: FeedItem[];
  fetchedAt: string;
}

export function SignalsFeed({ items, fetchedAt }: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "outbreak" | "publication" | "preprint">("all");

  const filtered = useMemo(() => {
    let r = items;
    if (tab !== "all") r = r.filter((i) => i.kind === tab);
    if (query) {
      const q = query.toLowerCase();
      r = r.filter((i) => i.title.toLowerCase().includes(q) || (i.body ?? "").toLowerCase().includes(q) || i.source.toLowerCase().includes(q));
    }
    return r;
  }, [items, query, tab]);

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[360px] z-10 bg-[var(--color-bg-secondary)]/95 backdrop-blur-md border-l border-[var(--color-border)] flex flex-col hidden lg:flex">
      <header className="p-4 border-b border-[var(--color-border-soft)]">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Signals</h2>
            <p className="text-[11px] text-[var(--color-fg-muted)]">
              <span suppressHydrationWarning>updated {fmtRelative(fetchedAt)}</span> · {items.length} total
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search signals…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 mt-2.5 text-[10px] uppercase tracking-wider font-bold">
          {(["all", "outbreak", "publication", "preprint"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-2 py-1 rounded ${
                tab === t
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-fg-muted)]">No signals match your filter.</div>
        ) : (
          <ul>
            {filtered.map((item) => (
              <li key={item.id} className="border-b border-[var(--color-border-soft)] last:border-b-0">
                {item.url ? (
                  <a
                    href={item.url}
                    target={item.url.startsWith("http") ? "_blank" : undefined}
                    rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block p-3.5 hover:bg-[var(--color-bg-hover)]"
                  >
                    <SignalRow item={item} />
                  </a>
                ) : (
                  <div className="p-3.5"><SignalRow item={item} /></div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SignalRow({ item }: { item: FeedItem }) {
  const kindStyles =
    item.kind === "outbreak"
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : item.kind === "publication"
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : "bg-purple-500/15 text-purple-300 border-purple-500/30";
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${kindStyles}`}
        >
          {item.kind}
        </span>
        <span className="text-[10px] text-[var(--color-fg-muted)]" suppressHydrationWarning>
          {fmtRelative(item.date)}
        </span>
        {item.flag && (
          <span className="text-[10px] text-[var(--color-fg-muted)] ml-auto">
            {item.flag} {item.country}
          </span>
        )}
      </div>
      <h3 className="text-[13px] font-semibold leading-snug">{item.title}</h3>
      {item.body && (
        <p className="text-[11px] text-[var(--color-fg-muted)] mt-1 line-clamp-2 leading-snug">{item.body}</p>
      )}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-[var(--color-fg-muted)]">
          {item.source} · {fmtDate(item.date)}
        </span>
        {item.url?.startsWith("http") && <ExternalLink className="h-3 w-3 text-[var(--color-fg-muted)]" />}
      </div>
    </>
  );
}

/**
 * Convert internal data sources to a unified feed shape.
 */
export function buildFeed(
  events: OutbreakEvent[],
  pubs: Array<{ id: string; title: string; year: number; journal: string; url: string }>,
  preprints: Array<{ doi: string; title: string; date: string; server: string; url: string }>
): FeedItem[] {
  const out: FeedItem[] = [];
  for (const e of events) {
    out.push({
      id: e.id,
      kind: "outbreak",
      title: e.title,
      body: e.body,
      source: e.source ?? "WHO DON",
      date: e.date,
      url: `/outbreaks/${e.id}`,
      flag: e.flag,
      country: e.country,
    });
  }
  for (const p of pubs) {
    out.push({
      id: p.id,
      kind: "publication",
      title: p.title,
      source: p.journal || "EuropePMC",
      date: p.year ? `${p.year}-01-01` : new Date().toISOString().slice(0, 10),
      url: p.url,
    });
  }
  for (const p of preprints) {
    out.push({
      id: p.doi,
      kind: "preprint",
      title: p.title,
      source: p.server,
      date: p.date,
      url: p.url,
    });
  }
  return out.sort((a, b) => (a.date > b.date ? -1 : 1));
}
