import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { RelativeTime } from "@/components/relative-time";
import { fmtDate } from "@/lib/format";
import { Radio } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle: string;
  snapshotDate?: string;
  freshness?: string; // e.g. "WHO + CDC"
  relativeFetch?: string; // ISO timestamp of last live fetch
}

export function Topbar({ title, subtitle, snapshotDate, freshness, relativeFetch }: TopbarProps) {
  return (
    <header className="flex justify-between items-start mb-8 gap-4 flex-wrap pl-12 lg:pl-0">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="success" pulse>
          <Radio className="h-3 w-3" />
          Live · {freshness ?? "WHO + CDC"}
        </Badge>
        {snapshotDate && (
          <Badge variant="brand">
            As of {fmtDate(snapshotDate)}
          </Badge>
        )}
        {relativeFetch && (
          <span className="text-[11px] text-[var(--color-fg-muted)] hidden sm:inline">
            <RelativeTime iso={relativeFetch} prefix="fetched" />
          </span>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
