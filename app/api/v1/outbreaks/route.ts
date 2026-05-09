import { NextResponse } from "next/server";
import { fetchLive } from "@/lib/sources";

export const revalidate = 21600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const severity = url.searchParams.get("severity");

  const { events, fetchedAt } = await fetchLive();
  let rows = events;
  if (since) rows = rows.filter((e) => e.date >= since);
  if (severity) rows = rows.filter((e) => e.severity === severity);

  return NextResponse.json(
    { count: rows.length, fetched_at: fetchedAt, source: "WHO Disease Outbreak News", data: rows },
    {
      headers: {
        "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    }
  );
}
