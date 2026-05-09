import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { fmtDate } from "@/lib/format";
import { Radio } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle: string;
  snapshotDate?: string;
  freshness?: string; // e.g. "WHO + CDC"
}

export function Topbar({ title, subtitle, snapshotDate, freshness }: TopbarProps) {
  return (
    <header className="flex justify-between items-center mb-8 gap-4 flex-wrap pl-12 lg:pl-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <Badge variant="success" pulse>
          <Radio className="h-3 w-3" />
          Live · {freshness ?? "WHO + CDC"}
        </Badge>
        {snapshotDate && (
          <Badge variant="brand">
            As of {fmtDate(snapshotDate)}
          </Badge>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
