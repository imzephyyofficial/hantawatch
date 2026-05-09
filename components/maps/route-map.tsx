"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { EventRoute, Waypoint } from "@/lib/event-routes";

interface Props {
  route: EventRoute;
  height?: number;
}

const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const KIND_COLOR: Record<Waypoint["kind"], string> = {
  departure: "#22c55e",
  stopover:  "#3b82f6",
  current:   "#ef4444",
  hospital:  "#a855f7",
  evacuation: "#f59e0b",
};

const KIND_LABEL: Record<Waypoint["kind"], string> = {
  departure: "Departure",
  stopover: "Stopover",
  current: "Current location",
  hospital: "Hospital",
  evacuation: "Evacuation",
};

export function RouteMap({ route, height = 360 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    // Fit bounds to all waypoints
    const lngs = route.waypoints.map((w) => w.lng);
    const lats = route.waypoints.map((w) => w.lat);
    const center: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center,
      zoom: 1,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("load", () => {
      setReady(true);
      // Fit to all waypoints with padding
      const bounds = new maplibregl.LngLatBounds();
      for (const w of route.waypoints) bounds.extend([w.lng, w.lat]);
      m.fitBounds(bounds, { padding: 50, duration: 0, maxZoom: 4.5 });
    });
    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, [route]);

  // Draw polyline + markers once map is ready
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const m = mapRef.current;

    // Polyline as a GeoJSON line layer
    const lineId = "route-line";
    const sourceId = "route-source";
    if (m.getLayer(lineId)) m.removeLayer(lineId);
    if (m.getLayer(`${lineId}-glow`)) m.removeLayer(`${lineId}-glow`);
    if (m.getSource(sourceId)) m.removeSource(sourceId);

    m.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: route.waypoints.map((w) => [w.lng, w.lat]),
        },
      },
    });
    m.addLayer({
      id: `${lineId}-glow`,
      type: "line",
      source: sourceId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ef4444", "line-width": 8, "line-opacity": 0.18 },
    });
    m.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [2, 2] },
    });

    // Markers
    const markers: maplibregl.Marker[] = [];
    route.waypoints.forEach((w, i) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: ${KIND_COLOR[w.kind]};
        border: 2px solid white;
        box-shadow: 0 0 0 2px ${KIND_COLOR[w.kind]}40, 0 2px 6px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font: 600 11px ui-monospace, monospace;
        color: white;
        cursor: pointer;
      `;
      el.textContent = String(i + 1);
      el.title = `${w.name}${w.country ? ", " + w.country : ""} · ${KIND_LABEL[w.kind]}${w.date ? " · " + w.date : ""}${w.note ? "\n" + w.note : ""}`;
      const popup = new maplibregl.Popup({ offset: 16, className: "hw-route-popup" }).setHTML(`
        <div style="font:600 12px ui-sans-serif,system-ui;color:#fff;margin-bottom:4px">${w.name}${w.country ? ", " + w.country : ""}</div>
        <div style="font:11px ui-sans-serif;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em">${KIND_LABEL[w.kind]}${w.date ? " · " + w.date : ""}</div>
        ${w.note ? `<div style="font:11px ui-sans-serif;color:#d1d5db;margin-top:4px">${w.note}</div>` : ""}
      `);
      const marker = new maplibregl.Marker({ element: el }).setLngLat([w.lng, w.lat]).setPopup(popup).addTo(m);
      markers.push(marker);
    });

    return () => {
      markers.forEach((mk) => mk.remove());
    };
  }, [ready, route]);

  return (
    <>
      <style>{`
        .hw-route-popup .maplibregl-popup-content {
          background: var(--color-bg-secondary) !important;
          border: 1px solid var(--color-border) !important;
          border-radius: 8px !important;
          padding: 8px 10px !important;
          color: var(--color-fg) !important;
        }
        .hw-route-popup .maplibregl-popup-tip {
          border-top-color: var(--color-bg-secondary) !important;
          border-bottom-color: var(--color-bg-secondary) !important;
        }
      `}</style>
      <div ref={containerRef} className="rounded-lg overflow-hidden border border-[var(--color-border)]" style={{ height }} />
      <div className="flex flex-wrap gap-3 mt-3 text-[11px]">
        {(["departure", "stopover", "current", "hospital", "evacuation"] as Waypoint["kind"][]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} />
            <span className="text-[var(--color-fg-muted)]">{KIND_LABEL[k]}</span>
          </span>
        ))}
      </div>
    </>
  );
}
