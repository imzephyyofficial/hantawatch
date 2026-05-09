import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { listApiKeys, listSubscriptions, upsertUser } from "@/lib/db/queries";
import { isDbReady } from "@/lib/db/client";
import { AccountClient } from "./account-client";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage subscriptions, API keys, and saved views.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account");
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  // Mirror to our DB so FK from subscriptions/api_keys works even if the
  // Clerk webhook hasn't been configured yet.
  if (isDbReady) {
    await upsertUser({ id: userId, email });
  }

  const [subs, keys] = isDbReady
    ? await Promise.all([listSubscriptions(userId), listApiKeys(userId)])
    : [[], []];

  return (
    <>
      <Topbar
        title="Account"
        subtitle={email ? `Signed in as ${email}` : "Account"}
        freshness="signed-in"
      />

      {!isDbReady && (
        <Card className="mb-6 border-l-[3px] border-l-amber-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--color-fg-secondary)]">
              Account features need <code className="text-xs px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)]">DATABASE_URL</code>.
              On Vercel-hosted deploys this is injected automatically by the Neon integration.
            </div>
          </div>
        </Card>
      )}

      <AccountClient
        initialSubs={subs.map((s) => ({
          id: s.id,
          name: s.name,
          channel: s.channel,
          target: s.target,
          filter: s.filter as Record<string, unknown>,
          active: s.active === 1,
          createdAt: typeof s.createdAt === "string" ? s.createdAt : s.createdAt.toISOString(),
        }))}
        initialKeys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          rateLimitPerMinute: k.rateLimitPerMinute,
          createdAt: typeof k.createdAt === "string" ? k.createdAt : k.createdAt.toISOString(),
          lastUsedAt: k.lastUsedAt ? (typeof k.lastUsedAt === "string" ? k.lastUsedAt : k.lastUsedAt.toISOString()) : null,
        }))}
      />
    </>
  );
}
