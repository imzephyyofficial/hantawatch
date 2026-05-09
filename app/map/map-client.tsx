"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CountrySnapshot } from "@/lib/sources";
import type { OutbreakEvent } from "@/lib/types";
import type { MapMarker } from "@/components/maps/live-map";
import { buildMarkersFrom } from "@/components/maps/live-map";
import { LayerPanel } from "@/components/maps/layer-panel";
import { SignalsFeed, buildFeed } from "@/components/maps/signals-feed";
import { WelcomeModal } from "@/components/maps/welcome-modal";

const LiveMap = dynamic(() => import("@/components/maps/live-map").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-fg-muted)]">Loading map…</div>,
});

interface Props {
  countries: CountrySnapshot[];
  events: OutbreakEvent[];
  stateRows: Array<{ state: string; cumulative: number }>;
  publications: Array<{ id: string; title: string; year: number; journal: string; url: string }>;
  preprints: Array<{ doi: string; title: string; date: string; server: string; url: string }>;
  agencyArticles: Array<{ id: string; title: string; link: string; date: string; source: string }>;
  fetchedAt: string;
}

export function MapClient({ countries, events, stateRows, publications, preprints, agencyArticles, fetchedAt }: Props) {
  const allMarkers = useMemo(() => buildMarkersFrom(countries, stateRows), [countries, stateRows]);
  const feed = useMemo(
    () => buildFeed(events, publications, preprints, agencyArticles),
    [events, publications, preprints, agencyArticles]
  );
  const [visible, setVisible] = useState<Set<MapMarker["tier"]>>(new Set(["active", "historical", "endemic"]));

  const counts = useMemo(() => ({
    active: allMarkers.filter((m) => m.tier === "active").length,
    historical: allMarkers.filter((m) => m.tier === "historical").length,
    endemic: allMarkers.filter((m) => m.tier === "endemic").length,
  }), [allMarkers]);

  return (
    <div className="absolute inset-0">
      <LiveMap markers={allMarkers} visibleTiers={visible} />
      <LayerPanel visible={visible} setVisible={setVisible} counts={counts} />
      <SignalsFeed items={feed} fetchedAt={fetchedAt} />
      <WelcomeModal />
    </div>
  );
}
