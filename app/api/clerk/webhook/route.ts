/**
 * Clerk webhook receiver — mirrors users from Clerk into our `users` table
 * so subscriptions and api_keys (which FK to users) work.
 *
 * Configure in Clerk dashboard: webhook URL = /api/clerk/webhook,
 * subscribe to user.created / user.updated / user.deleted, copy the
 * signing secret into CLERK_WEBHOOK_SECRET.
 */

import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { upsertUser, deleteUser } from "@/lib/db/queries";

export const runtime = "nodejs";

interface ClerkUserData {
  id: string;
  email_addresses?: Array<{ email_address: string; id: string }>;
  primary_email_address_id?: string | null;
}

interface ClerkEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserData;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 503 });
  }

  // Verify signature
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let event: ClerkEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Fan out by event type
  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const u = event.data;
      const primary = u.email_addresses?.find((e) => e.id === u.primary_email_address_id);
      const email = primary?.email_address ?? u.email_addresses?.[0]?.email_address ?? "";
      if (!email) return NextResponse.json({ ok: true, skipped: "no email" });
      await upsertUser({ id: u.id, email });
      return NextResponse.json({ ok: true, action: "upserted" });
    }
    case "user.deleted": {
      await deleteUser(event.data.id);
      return NextResponse.json({ ok: true, action: "deleted" });
    }
    default:
      return NextResponse.json({ ok: true, action: "ignored" });
  }
}
