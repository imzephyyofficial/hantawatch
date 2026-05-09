"use client";

import { useEffect, useState } from "react";
import { fmtRelative } from "@/lib/format";

interface Props {
  iso: string;
  prefix?: string;
}

/**
 * Live "X minutes ago" counter. Renders the SSR'd value first (no flash)
 * then ticks every minute on the client.
 */
export function RelativeTime({ iso, prefix }: Props) {
  const [text, setText] = useState(() => fmtRelative(iso));

  useEffect(() => {
    const tick = () => setText(fmtRelative(iso));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [iso]);

  return <span suppressHydrationWarning>{prefix ? `${prefix} ` : ""}{text}</span>;
}
