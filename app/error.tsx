"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook for runtime error reporting (Sentry once provisioned)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== "undefined") {
      // window.Sentry?.captureException?.(error)
    }
    console.error("[hantawatch:error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-[var(--color-fg-muted)] mb-1">
          The dashboard hit an error rendering this view.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--color-fg-muted)] font-mono mb-6">digest: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button variant="primary" onClick={reset}>Try again</Button>
          <Link href="/"><Button>Home</Button></Link>
        </div>
      </div>
    </div>
  );
}
