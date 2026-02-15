"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Event } from "@/types/event";
import { MapControls } from "./MapControls";
import { MapStats } from "./MapStats";

const MapInner = dynamic(() => import("./MapInner").then((mod) => mod.MapInner), {
  ssr: false,
});

interface MapContainerProps {
  areaName?: string;
  stats: {
    total: number;
    today: number;
    upcoming: number;
  };
  enableMarkerPopup?: boolean;
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent?: (id: string) => void;
}

export function MapContainer({
  areaName = "日置市周辺",
  stats,
  enableMarkerPopup = true,
  events,
  selectedEventId,
  onSelectEvent,
}: MapContainerProps) {
  const [actions, setActions] = useState<{
    resetView: () => void;
    locateMe: () => void;
  } | null>(null);
  const [resolvedAreaName, setResolvedAreaName] = useState(areaName);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const requestSerialRef = useRef(0);

  const handleReady = useCallback((nextActions: { resetView: () => void; locateMe: () => void }) => {
    setActions(nextActions);
  }, []);

  const handleViewportCenterChange = useCallback((latLng: [number, number]) => {
    setMapCenter(latLng);
  }, []);

  useEffect(() => {
    setResolvedAreaName(areaName);
  }, [areaName]);

  useEffect(() => {
    if (!mapCenter) return;
    const timer = setTimeout(async () => {
      const requestId = ++requestSerialRef.current;
      try {
        const response = await fetch(`/api/geocode?lat=${mapCenter[0]}&lng=${mapCenter[1]}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => null)) as
          | {
              data?: { areaName?: string };
              areaName?: string;
            }
          | null;
        const nextAreaName = payload?.data?.areaName ?? payload?.areaName;
        if (!nextAreaName) return;
        if (requestId !== requestSerialRef.current) return;
        setResolvedAreaName(nextAreaName);
      } catch {
        // keep previous area label
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [mapCenter]);

  return (
    <section className="flex-1 relative overflow-hidden">
      <div id="map" className="w-full h-full">
        <MapInner
          events={events}
          selectedEventId={selectedEventId}
          enableMarkerPopup={enableMarkerPopup}
          onSelectEvent={onSelectEvent}
          onReady={handleReady}
          onViewportCenterChange={handleViewportCenterChange}
        />
      </div>

      <div className="hidden lg:flex absolute top-4 left-4 right-4 z-[1000] items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">表示エリア</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{resolvedAreaName}</p>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-6 left-4 z-[1000] pointer-events-none">
        <MapStats total={stats.total} today={stats.today} upcoming={stats.upcoming} />
      </div>

      <MapControls
        onClickMyLocation={() => actions?.locateMe()}
        onClickResetView={() => actions?.resetView()}
      />
    </section>
  );
}
