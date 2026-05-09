import Link from "next/link";
import type { OutbreakEvent } from "@/lib/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERITY_BORDER: Record<OutbreakEvent["severity"], string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-blue-500",
};

const SEVERITY_BADGE: Record<OutbreakEvent["severity"], BadgeVariant> = {
  high: "outbreak",
  medium: "warn",
  low: "monitored",
};

interface Props {
  events: OutbreakEvent[];
  linkable?: boolean;
}

export function AlertFeed({ events, linkable = true }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      {events.map((e) => {
        const content = (
          <article
            className={cn(
              "grid grid-cols-[auto_1fr_auto] gap-3.5 items-start p-3.5 rounded-lg border border-l-[3px]",
              "border-[var(--color-border)] bg-[var(--color-bg-card)] backdrop-blur-md",
              "hover:translate-x-0.5 transition-transform",
              SEVERITY_BORDER[e.severity]
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-lg" aria-hidden>
              {e.flag}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">{e.title}</h4>
              <p className="text-sm text-[var(--color-fg-muted)]">{e.body}</p>
              {e.source && (
                <p className="text-xs text-[var(--color-fg-muted)] mt-1.5">
                  Source: <span className="font-medium">{e.source}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 text-xs text-[var(--color-fg-muted)] whitespace-nowrap">
              <Badge variant={SEVERITY_BADGE[e.severity]}>{e.severity}</Badge>
              <span>{fmtDate(e.date)}</span>
            </div>
          </article>
        );
        return linkable ? (
          <Link key={e.id} href={`/outbreaks/${e.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg">
            {content}
          </Link>
        ) : (
          <div key={e.id}>{content}</div>
        );
      })}
    </div>
  );
}
