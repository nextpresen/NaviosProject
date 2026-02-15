"use client";

import type { ReactNode } from "react";
import { SpotBadge } from "../mobile/SpotBadge";
import { MapControls } from "./MapControls";
import { MapStats } from "./MapStats";
import { MapStyleToggle, type MapStyle } from "./MapStyleToggle";

interface MapContainerProps {
  areaName?: string;
  mapStyle: MapStyle;
  onChangeMapStyle?: (style: MapStyle) => void;
  onClickMyLocation?: () => void;
  onClickResetView?: () => void;
  stats: {
    total: number;
    today: number;
    upcoming: number;
  };
  mobileCount: number;
  mapSlot?: ReactNode;
}

export function MapContainer({
  areaName = "鹿児島県日置市",
  mapStyle,
  onChangeMapStyle,
  onClickMyLocation,
  onClickResetView,
  stats,
  mobileCount,
  mapSlot,
}: MapContainerProps) {
  return (
    <section className="flex-1 relative overflow-hidden">
      <div id="map" className="w-full h-full">
        {mapSlot}
      </div>

      <div className="hidden lg:flex absolute top-4 left-4 right-4 z-[1000] items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">表示エリア</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{areaName}</p>
        </div>
        <MapStyleToggle style={mapStyle} onChange={onChangeMapStyle} />
      </div>

      <div className="hidden lg:block absolute bottom-6 left-4 z-[1000] pointer-events-none">
        <MapStats total={stats.total} today={stats.today} upcoming={stats.upcoming} />
      </div>

      <MapControls onClickMyLocation={onClickMyLocation} onClickResetView={onClickResetView} />
      <SpotBadge count={mobileCount} />
    </section>
  );
}
