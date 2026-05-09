import { fetchLive } from "@/lib/sources";

export const revalidate = 21600;

const BASE = "https://hantawatch-global.vercel.app";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { events } = await fetchLive();
  const items = events
    .map((e) => {
      const url = `${BASE}/outbreaks/${e.id}`;
      return `
    <entry>
      <id>${url}</id>
      <title>${escapeXml(`${e.flag} ${e.title}`)}</title>
      <link href="${url}" />
      <link rel="related" href="${escapeXml(e.sourceUrl ?? BASE)}" />
      <updated>${new Date(e.date + "T00:00:00Z").toISOString()}</updated>
      <category term="${escapeXml(e.severity)}" />
      <author><name>${escapeXml(e.source ?? "WHO")}</name></author>
      <summary type="html">&lt;p&gt;${escapeXml(e.body)}&lt;/p&gt;${
        e.sourceUrl ? `&lt;p&gt;Source: &lt;a href="${escapeXml(e.sourceUrl)}"&gt;${escapeXml(e.source ?? e.sourceUrl)}&lt;/a&gt;&lt;/p&gt;` : ""
      }</summary>
    </entry>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>HantaWatch — Outbreak Alerts</title>
  <subtitle>WHO Disease Outbreak News for hantavirus, live</subtitle>
  <link href="${BASE}/api/rss/outbreaks" rel="self" />
  <link href="${BASE}/outbreaks" />
  <id>${BASE}/api/rss/outbreaks</id>
  <updated>${new Date().toISOString()}</updated>${items}
</feed>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
