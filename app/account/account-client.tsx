"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Key, Plus, Trash2, Copy, Check, AlertCircle } from "lucide-react";
import { fmtRelative, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SubRow {
  id: string;
  name: string;
  channel: string;
  target: string;
  filter: Record<string, unknown>;
  active: boolean;
  createdAt: string;
}

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  rateLimitPerMinute: number;
  createdAt: string;
  lastUsedAt: string | null;
}

interface Props {
  initialSubs: SubRow[];
  initialKeys: KeyRow[];
}

export function AccountClient({ initialSubs, initialKeys }: Props) {
  const [subs, setSubs] = useState<SubRow[]>(initialSubs);
  const [keys, setKeys] = useState<KeyRow[]>(initialKeys);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SubscriptionsCard
        subs={subs}
        setSubs={setSubs}
        setError={setError}
        pending={pending}
        startTransition={startTransition}
      />
      <ApiKeysCard
        keys={keys}
        setKeys={setKeys}
        setError={setError}
        pending={pending}
        startTransition={startTransition}
      />

      {error && (
        <Card className="lg:col-span-2 border-l-[3px] border-l-red-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--color-fg-secondary)]">{error}</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------- Subscriptions ----------

function SubscriptionsCard({
  subs,
  setSubs,
  setError,
  pending,
  startTransition,
}: {
  subs: SubRow[];
  setSubs: (next: SubRow[]) => void;
  setError: (m: string | null) => void;
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"email" | "slack" | "webhook" | "rss">("email");
  const [target, setTarget] = useState("");
  const [region, setRegion] = useState("");
  const [minSeverity, setMinSeverity] = useState<"low" | "medium" | "high">("medium");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const filter: Record<string, unknown> = { minSeverity };
      if (region) filter.regions = [region];
      const res = await fetch("/api/account/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, channel, target, filter }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Failed to create");
        return;
      }
      setSubs([j.data, ...subs]);
      setOpen(false);
      setName("");
      setTarget("");
    });
  };

  const remove = (id: string) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/account/subscriptions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Failed to delete");
        return;
      }
      setSubs(subs.filter((s) => s.id !== id));
    });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" /> Subscriptions
          </CardTitle>
          <CardSubtitle>{subs.length} active · alerts when filters match new events</CardSubtitle>
        </div>
        <Button onClick={() => setOpen((v) => !v)} disabled={pending}>
          <Plus className="h-3.5 w-3.5" /> {open ? "Cancel" : "New"}
        </Button>
      </CardHeader>

      {open && (
        <form onSubmit={submit} className="border-b border-[var(--color-border-soft)] pb-4 mb-4 space-y-2.5">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="hw-input" placeholder="My weekly digest" />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Channel">
              <select value={channel} onChange={(e) => setChannel(e.target.value as "email" | "slack" | "webhook" | "rss")} className="hw-input">
                <option value="email">Email</option>
                <option value="slack">Slack webhook</option>
                <option value="webhook">Generic webhook</option>
                <option value="rss">RSS feed</option>
              </select>
            </Field>
            <Field label="Min severity">
              <select value={minSeverity} onChange={(e) => setMinSeverity(e.target.value as "low" | "medium" | "high")} className="hw-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High only</option>
              </select>
            </Field>
          </div>
          <Field
            label={
              channel === "email"
                ? "Email address"
                : channel === "rss"
                ? "Slug for the RSS feed (your-name)"
                : "Webhook URL"
            }
          >
            <input value={target} onChange={(e) => setTarget(e.target.value)} required maxLength={1000} className="hw-input" />
          </Field>
          <Field label="Region (optional)">
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="hw-input">
              <option value="">Any</option>
              <option value="Americas">Americas</option>
              <option value="Europe">Europe</option>
              <option value="Asia">Asia</option>
              <option value="Africa">Africa</option>
            </select>
          </Field>
          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Create subscription"}
          </Button>
        </form>
      )}

      {subs.length === 0 ? (
        <p className="text-sm text-[var(--color-fg-muted)] py-4 text-center">No subscriptions yet.</p>
      ) : (
        <ul className="space-y-2">
          {subs.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--color-border-soft)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <Badge variant={s.active ? "success" : "default"}>{s.active ? "active" : "paused"}</Badge>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">{s.channel}</span>
                </div>
                <div className="text-xs text-[var(--color-fg-muted)] mt-1 truncate">
                  → {s.target}
                </div>
                <div className="text-[10px] text-[var(--color-fg-muted)] mt-0.5" suppressHydrationWarning>
                  Created {fmtRelative(s.createdAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`Delete ${s.name}`}
                disabled={pending}
                className="p-1.5 rounded hover:bg-red-500/15 text-[var(--color-fg-muted)] hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .hw-input {
          width: 100%;
          padding: 7px 10px;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-fg);
          font-size: 13px;
        }
        .hw-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>
    </Card>
  );
}

// ---------- API keys ----------

function ApiKeysCard({
  keys,
  setKeys,
  setError,
  pending,
  startTransition,
}: {
  keys: KeyRow[];
  setKeys: (next: KeyRow[]) => void;
  setError: (m: string | null) => void;
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, rateLimitPerMinute: rateLimit }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Failed to create");
        return;
      }
      setRevealed(j.data.token);
      setKeys([
        {
          id: j.data.id,
          name: j.data.name,
          prefix: j.data.prefix,
          rateLimitPerMinute: j.data.rateLimitPerMinute,
          createdAt: j.data.createdAt,
          lastUsedAt: null,
        },
        ...keys,
      ]);
      setOpen(false);
      setName("");
    });
  };

  const revoke = (id: string) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/account/api-keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Failed to revoke");
        return;
      }
      setKeys(keys.filter((k) => k.id !== id));
    });
  };

  const copy = async () => {
    if (!revealed) return;
    await navigator.clipboard?.writeText(revealed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-400" /> API keys
          </CardTitle>
          <CardSubtitle>
            {keys.length} active · use against{" "}
            <code className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)]">/api/v1/*</code>
          </CardSubtitle>
        </div>
        <Button onClick={() => setOpen((v) => !v)} disabled={pending}>
          <Plus className="h-3.5 w-3.5" /> {open ? "Cancel" : "New"}
        </Button>
      </CardHeader>

      {revealed && (
        <div className="border-l-[3px] border-l-emerald-500 bg-emerald-500/10 p-3 rounded mb-4">
          <div className="flex items-start gap-2 mb-2 text-xs text-emerald-300 font-semibold">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>This token is shown ONCE. Copy it now — we only store its hash.</span>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 text-xs font-mono break-all p-2 rounded bg-[var(--color-bg-input)] border border-[var(--color-border)]">
              {revealed}
            </code>
            <button
              type="button"
              onClick={copy}
              className="px-3 py-1.5 rounded bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 flex items-center gap-1.5 flex-shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealed(null)}
            className="mt-2 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] underline"
          >
            I&rsquo;ve saved it — hide
          </button>
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="border-b border-[var(--color-border-soft)] pb-4 mb-4 space-y-2.5">
          <Field label="Key name">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="hw-input" placeholder="my-app prod" />
          </Field>
          <Field label="Rate limit (req / minute)">
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              min={1}
              max={600}
              className="hw-input"
            />
          </Field>
          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Generating…" : "Generate key"}
          </Button>
        </form>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-[var(--color-fg-muted)] py-4 text-center">No keys yet.</p>
      ) : (
        <ul className="space-y-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--color-border-soft)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{k.name}</span>
                  <code className="text-[11px] font-mono text-[var(--color-fg-muted)]">{k.prefix}…</code>
                </div>
                <div className="text-xs text-[var(--color-fg-muted)] mt-1">
                  {k.rateLimitPerMinute}/min ·{" "}
                  {k.lastUsedAt ? (
                    <span suppressHydrationWarning>last used {fmtRelative(k.lastUsedAt)}</span>
                  ) : (
                    "never used"
                  )}{" "}
                  · created <span suppressHydrationWarning>{fmtDate(k.createdAt.slice(0, 10))}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => revoke(k.id)}
                aria-label={`Revoke ${k.name}`}
                disabled={pending}
                className="p-1.5 rounded hover:bg-red-500/15 text-[var(--color-fg-muted)] hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .hw-input {
          width: 100%;
          padding: 7px 10px;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-fg);
          font-size: 13px;
        }
        .hw-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={cn("block")}>
      <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-fg-muted)] block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
