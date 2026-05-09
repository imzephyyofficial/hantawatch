import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSubscription, deleteSubscription, listSubscriptions, type SubscriptionFilter } from "@/lib/db/queries";

export const runtime = "nodejs";

const CHANNELS = new Set(["email", "slack", "webhook", "rss"]);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const subs = await listSubscriptions(userId);
  return NextResponse.json({ data: subs });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { name, filter, channel, target } = body as {
    name?: string;
    filter?: SubscriptionFilter;
    channel?: string;
    target?: string;
  };

  if (!name || typeof name !== "string" || name.length > 80) {
    return NextResponse.json({ error: "name required, ≤ 80 chars" }, { status: 400 });
  }
  if (!channel || !CHANNELS.has(channel)) {
    return NextResponse.json({ error: "channel must be one of email|slack|webhook|rss" }, { status: 400 });
  }
  if (!target || typeof target !== "string" || target.length > 1000) {
    return NextResponse.json({ error: "target required, ≤ 1000 chars" }, { status: 400 });
  }

  const row = await createSubscription({
    userId,
    name,
    filter: filter ?? {},
    channel: channel as "email" | "slack" | "webhook" | "rss",
    target,
  });
  if (!row) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  return NextResponse.json({ data: row }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
  const row = await deleteSubscription({ id, userId });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: row });
}
