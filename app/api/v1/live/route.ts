import { NextResponse } from "next/server";
import { fetchWhoLive } from "@/lib/live";

export const revalidate = 21600;

export async function GET() {
  const result = await fetchWhoLive();
  return NextResponse.json(
    {
      ok: result.ok,
      source: result.source,
      fetched_at: result.fetchedAt,
      count: result.events.length,
      data: result.events,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    }
  );
}
