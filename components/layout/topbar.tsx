import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { snapshotDate } from "@/lib/metrics";
import { fmtDate } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const snapshot = snapshotDate();
  return (
    <header className="flex justify-between items-center mb-8 gap-4 flex-wrap pl-12 lg:pl-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <Badge variant="warn" title="Data is illustrative — see official sources for current figures">
          <AlertTriangle className="h-3 w-3" /> Demo data
        </Badge>
        <Badge variant="success" pulse>
          Snapshot · {fmtDate(snapshot)}
        </Badge>
        <ThemeToggle />
      </div>
    </header>
  );
}
