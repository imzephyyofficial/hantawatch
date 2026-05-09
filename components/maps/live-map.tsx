"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { COUNTRY_CENTROID, stateCentroid } from "@/lib/geo";

export interface MapMarker {
  iso: string;                  // unique key (e.g. "ar", "us-nebraska")
  label: string;                // e.g. "Argentina" or "Nebraska, USA"
  flag?: string;
  lng: number;
  lat: number;
  weight: number;               // 1+ — drives marker size/intensity
  tier: "active" | "endemic" | "historical";
  detail?: string;              // tooltip line e.g. "8 cases · 3 deaths"
  href?: string;                // link target (e.g. /country/ar)
}

interface Props {
  markers: MapMarker[];
  visibleTiers: Set<MapMarker["tier"]>;
  onMarkerClick?: (m: MapMarker) => void;
}

const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const TIER_COLOR: Record<MapMarker["tier"], string> = {
  active: "#ef4444",      // red — recent outbreak signal
  historical: "#f59e0b",  // amber — long-term reporting
  endemic: "#a855f7",     // purple — endemic zone
};

export function LiveMap({ markers, visibleTiers, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerObjectsRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [10, 25],
      zoom: 1.6,
      attributionControl: { compact: true },
      cooperativeGestures: false,
      maxZoom: 8,
      minZoom: 1.2,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("load", () => setReady(true));
    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)build markers whenever data or visible tiers change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    // tear down previous
    markerObjectsRef.current.forEach((m) => m.remove());
    markerObjectsRef.current = [];

    const filtered = markers.filter((m) => visibleTiers.has(m.tier));
    for (const mk of filtered) {
      const el = document.createElement("div");
      el.className = "hw-marker";
      el.dataset.tier = mk.tier;
      // size scales with log(weight) so a 100-mention pin doesn't dwarf a 1
      const size = Math.min(48, 14 + Math.round(Math.log2(mk.weight + 1) * 6));
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${TIER_COLOR[mk.tier]};
        opacity: 0.85;
        cursor: ${mk.href ? "pointer" : "default"};
        display: flex;
        align-items: center;
        justify-content: center;
        font: 600 ${Math.max(10, size / 3)}px ui-monospace, "SF Mono", monospace;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        box-shadow:
          0 0 0 2px rgba(255,255,255,0.15),
          0 0 ${size}px ${TIER_COLOR[mk.tier]}88;
        animation: hw-pulse 2.4s ease-in-out infinite;
      `;
      if (mk.weight > 1) el.textContent = String(mk.weight);
      // tooltip + click
      el.title = `${mk.label}${mk.detail ? "\n" + mk.detail : ""}`;
      el.addEventListener("click", () => {
        if (onMarkerClick) onMarkerClick(mk);
        if (mk.href) window.location.href = mk.href;
      });
      const marker = new maplibregl.Marker({ element: el }).setLngLat([mk.lng, mk.lat]).addTo(mapRef.current!);
      markerObjectsRef.current.push(marker);
    }
  }, [markers, visibleTiers, ready, onMarkerClick]);

  return (
    <>
      <style>{`
        @keyframes hw-pulse {
          0%, 100% { transform: scale(1); }
          50%     { transform: scale(1.12); }
        }
        .maplibregl-ctrl-attrib-button { background-color: rgba(0,0,0,0.4) !important; }
        .maplibregl-ctrl-attrib { background: rgba(15,23,42,0.6) !important; }
        .maplibregl-ctrl-attrib a { color: #94a3b8 !important; }
        .maplibregl-canvas { outline: none; }
      `}</style>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" aria-label="Interactive global hantavirus signal map" />
    </>
  );
}

/**
 * Helper: build markers from CountrySnapshot[] + NNDSS state rows.
 */
export function buildMarkersFrom(
  countries: Array<{ iso: string; country: string; flag?: string; cases: number | null; deaths: number | null; status: string | null; strain: string | null }>,
  stateRows: Array<{ state: string; cumulative: number }>
): MapMarker[] {
  const markers: MapMarker[] = [];

  for (const c of countries) {
    const ll = COUNTRY_CENTROID[c.iso];
    if (!ll) continue;
    const tier: MapMarker["tier"] = c.status === "outbreak" ? "active" : c.status === "active" ? "active" : "historical";
    const weight = c.cases ?? (c.status === "outbreak" ? 5 : 1);
    markers.push({
      iso: c.iso,
      label: `${c.flag ?? ""} ${c.country}`.trim(),
      flag: c.flag,
      lng: ll[0],
      lat: ll[1],
      weight,
      tier,
      detail: c.cases != null ? `${c.cases.toLocaleString()} cases${c.deaths != null ? ` · ${c.deaths} deaths` : ""}${c.strain ? ` · ${c.strain}` : ""}` : (c.strain ?? "Listed in current WHO DON"),
      href: `/country/${c.iso}`,
    });
  }

  for (const s of stateRows) {
    const ll = stateCentroid(s.state);
    if (!ll) continue;
    markers.push({
      iso: `us-${s.state.toLowerCase().replace(/\s+/g, "-")}`,
      label: `${s.state}, USA`,
      lng: ll[0],
      lat: ll[1],
      weight: s.cumulative,
      tier: "historical",
      detail: `${s.cumulative} cumulative ${s.cumulative === 1 ? "case" : "cases"} (NNDSS YTD)`,
      href: "/country/us",
    });
  }

  return markers;
}
