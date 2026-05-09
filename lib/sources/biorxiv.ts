/**
 * bioRxiv / medRxiv — preprint server.
 *
 * Public API. We pull recent preprints across the platform and filter for
 * hantavirus mentions. (The native search isn't great, so this is a
 * client-side filter on a recent window.)
 *
 * Docs: https://api.biorxiv.org/
 */

export interface PreprintSignal {
  count: number;
  recent: Array<{ doi: string; title: string; authors: string; date: string; server: "biorxiv" | "medrxiv"; url: string }>;
  fetchedAt: string;
  ok: boolean;
  source: "bioRxiv/medRxiv";
  sourceUrl: string;
}

const empty = (fetchedAt: string, ok: boolean): PreprintSignal => ({
  count: 0,
  recent: [],
  fetchedAt,
  ok,
  source: "bioRxiv/medRxiv",
  sourceUrl: "https://www.biorxiv.org/search/hantavirus",
});

interface BiorxivPaper {
  doi: string;
  title: string;
  authors: string;
  date: string;
  abstract?: string;
}

async function fetchOne(server: "biorxiv" | "medrxiv", since: string, until: string) {
  // Their API is paginated; we fetch the first page (~30) per server and filter
  const r = await fetch(`https://api.biorxiv.org/details/${server}/${since}/${until}/0`, {
    headers: { accept: "application/json", "user-agent": "HantaWatch/4 (+https://hantawatch-global.vercel.app)" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return [];
  const data = (await r.json()) as { collection?: BiorxivPaper[] };
  return (data.collection ?? []).filter((p) =>
    /hantavirus|orthohantavirus|HCPS|HFRS|Sin\s+Nombre|Andes\s+virus|Puumala|Hantaan/i.test(
      `${p.title} ${p.abstract ?? ""}`
    )
  );
}

export async function fetchBiorxiv(): Promise<PreprintSignal> {
  const fetchedAt = new Date().toISOString();
  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 86_400_000);
    const since = ninetyDaysAgo.toISOString().slice(0, 10);
    const until = today.toISOString().slice(0, 10);

    const [bio, med] = await Promise.allSettled([
      fetchOne("biorxiv", since, until),
      fetchOne("medrxiv", since, until),
    ]);

    const all = [
      ...(bio.status === "fulfilled" ? bio.value.map((p) => ({ ...p, server: "biorxiv" as const })) : []),
      ...(med.status === "fulfilled" ? med.value.map((p) => ({ ...p, server: "medrxiv" as const })) : []),
    ].sort((a, b) => (a.date > b.date ? -1 : 1));

    return {
      count: all.length,
      recent: all.slice(0, 5).map((p) => ({
        doi: p.doi,
        title: p.title,
        authors: p.authors.slice(0, 200),
        date: p.date,
        server: p.server,
        url: `https://doi.org/${p.doi}`,
      })),
      fetchedAt,
      ok: true,
      source: "bioRxiv/medRxiv",
      sourceUrl: "https://www.biorxiv.org/search/hantavirus",
    };
  } catch {
    return empty(fetchedAt, false);
  }
}
