import { outbreakEvents } from "@/lib/data";
import { fetchWhoLive } from "@/lib/live";

export const revalidate = 3600;

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
  const live = await fetchWhoLive();
  const merged = [
    ...live.events.map((e) => ({ ...e, _live: true as const })),
    ...outbreakEvents.map((e) => ({ ...e, _live: false as const })),
  ].sort((a, b) => (a.date > b.date ? -1 : 1));

  const items = merged
    .map((e) => {
      const isExternal = e._live;
      const url = isExternal ? (e.sourceUrl ?? `${BASE}/outbreaks`) : `${BASE}/outbreaks/${e.id}`;
      const labelPrefix = isExternal ? "[WHO] " : "";
      return `
    <entry>
      <id>${url}</id>
      <title>${escapeXml(`${e.flag} ${labelPrefix}${e.title}`)}</title>
      <link href="${url}" />
      <updated>${new Date(e.date + "T00:00:00Z").toISOString()}</updated>
      <category term="${escapeXml(e.severity)}" />
      <author><name>${escapeXml(e.source ?? "HantaWatch")}</name></author>
      <summary type="html">&lt;p&gt;${escapeXml(e.body)}&lt;/p&gt;${
        e.sourceUrl ? `&lt;p&gt;Source: &lt;a href="${escapeXml(e.sourceUrl)}"&gt;${escapeXml(e.source ?? e.sourceUrl)}&lt;/a&gt;&lt;/p&gt;` : ""
      }</summary>
    </entry>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>HantaWatch — Outbreak Alerts</title>
  <subtitle>Recent hantavirus outbreak signals worldwide</subtitle>
  <link href="${BASE}/api/rss/outbreaks" rel="self" />
  <link href="${BASE}/outbreaks" />
  <id>${BASE}/api/rss/outbreaks</id>
  <updated>${new Date().toISOString()}</updated>${items}
</feed>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
