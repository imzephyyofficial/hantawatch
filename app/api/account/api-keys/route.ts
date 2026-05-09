import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const keys = await listApiKeys(userId);
  // Never return keyHash to the client; only metadata
  const safe = keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    scopes: k.scopes,
    rateLimitPerMinute: k.rateLimitPerMinute,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
  }));
  return NextResponse.json({ data: safe });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string; rateLimitPerMinute?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "name required, ≤ 80 chars" }, { status: 400 });
  }

  const rateLimit = Math.max(1, Math.min(600, Number(body.rateLimitPerMinute) || 60));
  const result = await createApiKey({ userId, name, rateLimitPerMinute: rateLimit });
  if (!result) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // Return the raw token EXACTLY ONCE. Client must record it.
  return NextResponse.json(
    {
      data: {
        id: result.row.id,
        name: result.row.name,
        prefix: result.row.prefix,
        rateLimitPerMinute: result.row.rateLimitPerMinute,
        createdAt: result.row.createdAt,
        token: result.rawToken,
      },
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
  const row = await revokeApiKey({ id, userId });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: { id: row.id, revokedAt: row.revokedAt } });
}
