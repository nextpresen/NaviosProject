"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { Event } from "@/types/event";
import { SpotBadge } from "../mobile/SpotBadge";
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
  mobileCount: number;
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent?: (id: string) => void;
}

export function MapContainer({
  areaName = "鹿児島県日置市",
  stats,
  mobileCount,
  events,
  selectedEventId,
  onSelectEvent,
}: MapContainerProps) {
  const [actions, setActions] = useState<{
    resetView: () => void;
    locateMe: () => void;
  } | null>(null);

  const handleReady = useCallback((nextActions: { resetView: () => void; locateMe: () => void }) => {
    setActions(nextActions);
  }, []);

  return (
    <section className="flex-1 relative overflow-hidden">
      <div id="map" className="w-full h-full">
        <MapInner
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
          onReady={handleReady}
        />
      </div>

      <div className="hidden lg:flex absolute top-4 left-4 right-4 z-[1000] items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">表示エリア</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{areaName}</p>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-6 left-4 z-[1000] pointer-events-none">
        <MapStats total={stats.total} today={stats.today} upcoming={stats.upcoming} />
      </div>

      <MapControls
        onClickMyLocation={() => actions?.locateMe()}
        onClickResetView={() => actions?.resetView()}
      />
      <SpotBadge count={mobileCount} />
    </section>
  );
}
