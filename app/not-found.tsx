import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🦠</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-[var(--color-fg-muted)] mb-6">
          That route doesn&rsquo;t exist. The dashboard, surveillance table, and outbreak feed are all reachable below.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Link href="/"><Button variant="primary">Dashboard</Button></Link>
          <Link href="/outbreaks"><Button>Outbreaks</Button></Link>
          <Link href="/surveillance"><Button>Surveillance</Button></Link>
        </div>
      </div>
    </div>
  );
}
