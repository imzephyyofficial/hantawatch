import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isDbReady } from "@/lib/db/client";
import { Bell, Key, FileText, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage subscriptions, API keys, and saved views.",
  robots: { index: false },
};

export default async function Page() {
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <>
      <Topbar
        title="Account"
        subtitle={user ? `Signed in as ${user.emailAddresses[0]?.emailAddress ?? userId}` : "Account"}
        freshness="account"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-amber-400" /> Subscriptions</CardTitle>
              <CardSubtitle>Email + webhook alerts on outbreak signals</CardSubtitle>
            </div>
            <Badge>coming soon</Badge>
          </CardHeader>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Filter on region / strain / severity. Delivered via Resend (when wired) or webhook.
            Cron diffs new events vs. last run and dispatches.
          </p>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4 text-blue-400" /> API keys</CardTitle>
              <CardSubtitle>Programmatic access to /api/v1/*</CardSubtitle>
            </div>
            <Badge>coming soon</Badge>
          </CardHeader>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Free tier: 1k requests/day. Pro tier: 100k/day with webhooks. Anonymous /api/v1/* keeps working at a soft limit.
          </p>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-400" /> Annotations</CardTitle>
              <CardSubtitle>Flag or correct surveillance data</CardSubtitle>
            </div>
            <Badge>coming soon</Badge>
          </CardHeader>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Auth&rsquo;d contributors with verified credentials can annotate spikes / link primary sources.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>System</CardTitle>
            <CardSubtitle>Account-domain backend status</CardSubtitle>
          </div>
        </CardHeader>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span>Auth (Clerk)</span>
            <Badge variant={user ? "success" : "warn"}>{user ? "signed in" : "anonymous"}</Badge>
          </li>
          <li className="flex items-center justify-between">
            <span>Database (Neon Postgres)</span>
            <Badge variant={isDbReady ? "success" : "warn"}>{isDbReady ? "connected" : "not connected"}</Badge>
          </li>
          <li className="flex items-center justify-between">
            <span>Email (Resend)</span>
            <Badge>not provisioned</Badge>
          </li>
        </ul>
        <p className="text-xs text-[var(--color-fg-muted)] mt-4">
          Subscription / API-key / annotation features land once schema migrations run and Resend is connected.
          Track progress in <a href="/sources" className="text-blue-400 hover:text-blue-300">/sources <ExternalLink className="inline h-3 w-3" /></a>.
        </p>
      </Card>
    </>
  );
}
