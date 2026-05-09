import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { BigCounter } from "@/components/cards/big-counter";
import { fetchResearch } from "@/lib/sources/research";
import { fmt, fmtRelative, fmtDate } from "@/lib/format";
import { ExternalLink, FileText, FlaskConical, BookOpen, Globe2 } from "lucide-react";

const PageviewsChart = dynamic(() => import("@/components/charts/pageviews-chart").then((m) => m.PageviewsChart), {
  loading: () => <div className="h-[260px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading chart…</div>,
});

export const metadata: Metadata = {
  title: "Research activity",
  description: "Publication, preprint, and public-interest signals for hantavirus tracked across EuropePMC, bioRxiv/medRxiv, and Wikipedia.",
};

export const revalidate = 21600;

export default async function Page() {
  const { publications, preprints, pageviews, fetchedAt } = await fetchResearch();

  return (
    <>
      <Topbar
        title="Research activity"
        subtitle="Scientific output and public attention around hantavirus"
        relativeFetch={fetchedAt}
        freshness="EuropePMC + bioRxiv + Wikipedia"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <BigCounter
          label="EuropePMC papers"
          value={publications.ok ? fmt(publications.totalHits) : "—"}
          sub="All-time hantavirus papers"
          accent="brand"
        />
        <BigCounter
          label="Papers this year"
          value={publications.ok ? String(publications.recentCount) : "—"}
          sub="Visible in latest 10"
          accent="success"
        />
        <BigCounter
          label="Preprints (90d)"
          value={preprints.ok ? String(preprints.count) : "—"}
          sub="bioRxiv + medRxiv"
          accent="purple"
        />
        <BigCounter
          label="Wiki views (30d)"
          value={pageviews.ok ? fmt(pageviews.totalLast30d) : "—"}
          sub={pageviews.ok ? `${fmt(pageviews.totalLast7d)} in last 7 days` : "—"}
          accent="cyan"
        />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-cyan-400" /> Public attention — Wikipedia pageviews
            </CardTitle>
            <CardSubtitle>
              Daily aggregate across <em>Orthohantavirus</em>, <em>HPS</em>, and <em>HFRS</em> articles · 60-day window
            </CardSubtitle>
          </div>
          <a href={pageviews.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-muted)] hover:text-blue-400">
            Wikimedia source <ExternalLink className="inline h-3 w-3" />
          </a>
        </CardHeader>
        {pageviews.ok && pageviews.series.length > 0 ? (
          <PageviewsChart series={pageviews.series} />
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Pageview data unavailable.</div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" /> Recent publications
              </CardTitle>
              <CardSubtitle>EuropePMC · most recent first</CardSubtitle>
            </div>
            <a href={publications.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-muted)] hover:text-blue-400">
              Source <ExternalLink className="inline h-3 w-3" />
            </a>
          </CardHeader>
          {publications.recentPapers.length === 0 ? (
            <p className="text-sm text-[var(--color-fg-muted)] py-6 text-center">No recent publications returned.</p>
          ) : (
            <ul className="space-y-3">
              {publications.recentPapers.map((p) => (
                <li key={p.id} className="border-b border-[var(--color-border-soft)] pb-3 last:border-b-0 last:pb-0">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-blue-400 leading-snug">
                    {p.title}
                  </a>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-1">
                    {p.authors ? p.authors.split(",").slice(0, 3).join(", ") + (p.authors.split(",").length > 3 ? " et al." : "") : "Unknown authors"}
                    {p.journal && <> · <span className="italic">{p.journal}</span></>}
                    {p.year > 0 && <> · {p.year}</>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-purple-400" /> Recent preprints
              </CardTitle>
              <CardSubtitle>bioRxiv + medRxiv · last 90 days</CardSubtitle>
            </div>
            <a href={preprints.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-muted)] hover:text-blue-400">
              Source <ExternalLink className="inline h-3 w-3" />
            </a>
          </CardHeader>
          {preprints.recent.length === 0 ? (
            <p className="text-sm text-[var(--color-fg-muted)] py-6 text-center">
              No hantavirus preprints in the last 90 days. (Preprint activity is sparse for endemic diseases.)
            </p>
          ) : (
            <ul className="space-y-3">
              {preprints.recent.map((p) => (
                <li key={p.doi} className="border-b border-[var(--color-border-soft)] pb-3 last:border-b-0 last:pb-0">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-blue-400 leading-snug">
                    {p.title}
                  </a>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-1">
                    {p.authors ? p.authors.split(";").slice(0, 3).join(", ") : "Unknown authors"}
                    <> · {p.server} · {fmtDate(p.date)}</>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" /> Methodology
            </CardTitle>
          </div>
        </CardHeader>
        <ul className="space-y-2 text-sm text-[var(--color-fg-secondary)]">
          <li><strong>Publications:</strong> EuropePMC search for &quot;hantavirus&quot;, sorted by first publication date desc. Total hit count + 10 most recent.</li>
          <li><strong>Preprints:</strong> bioRxiv + medRxiv recent details windowed to last 90 days, filtered client-side for hantavirus / strain mentions in title or abstract.</li>
          <li><strong>Pageviews:</strong> Wikimedia REST API daily counts for the canonical hantavirus articles in English Wikipedia, last 60 days, all-access agents.</li>
          <li><strong>Refresh:</strong> all three cached at the edge for 6 hours via Next.js revalidation.</li>
        </ul>
        <p className="text-xs text-[var(--color-fg-muted)] mt-3">
          Last fetched <span suppressHydrationWarning>{fmtRelative(fetchedAt)}</span>.
        </p>
      </Card>
    </>
  );
}
