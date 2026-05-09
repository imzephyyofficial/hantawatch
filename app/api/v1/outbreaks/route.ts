import { NextResponse } from "next/server";
import { outbreakEvents } from "@/lib/data";

export const revalidate = 3600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const severity = url.searchParams.get("severity");

  let events = outbreakEvents;
  if (since) events = events.filter((e) => e.date >= since);
  if (severity) events = events.filter((e) => e.severity === severity);

  return NextResponse.json(
    { count: events.length, data: events },
    {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    }
  );
}
