"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer as LeafletMapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/constants";

type PickMode = "center-fixed" | "tap-drop";

interface PostLocationPickerInnerProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}

function isClose(a: number, b: number) {
  return Math.abs(a - b) < 0.000001;
}

function markerIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 4px 8px rgba(15,23,42,.28));">
        <div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#ec4899,#be185d);border:2px solid #fff;"></div>
        <div style="position:absolute;top:8px;left:8px;width:14px;height:14px;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;color:#be185d;font-weight:800;">●</div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

function CenterSync({
  latitude,
  longitude,
  mode,
}: {
  latitude: number;
  longitude: number;
  mode: PickMode;
}) {
  const map = useMap();

  useEffect(() => {
    const center = map.getCenter();
    if (isClose(center.lat, latitude) && isClose(center.lng, longitude)) return;
    map.setView([latitude, longitude], map.getZoom(), { animate: false });
  }, [latitude, longitude, map]);

  useEffect(() => {
    if (mode !== "center-fixed") return;
    const onMoveEnd = () => {
      const center = map.getCenter();
      map.fire("navios:center-fixed:update", {
        lat: center.lat,
        lng: center.lng,
      } as never);
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map, mode]);

  return null;
}

function SelectEvents({
  mode,
  onPick,
}: {
  mode: PickMode;
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(event) {
      if (mode !== "tap-drop") return;
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    const onCenterFixedUpdate = (event: L.LeafletEvent) => {
      if (mode !== "center-fixed") return;
      const detail = event as L.LeafletEvent & { lat?: number; lng?: number };
      if (typeof detail.lat !== "number" || typeof detail.lng !== "number") return;
      onPick(detail.lat, detail.lng);
    };
    map.on("navios:center-fixed:update", onCenterFixedUpdate);
    return () => {
      map.off("navios:center-fixed:update", onCenterFixedUpdate);
    };
  }, [map, mode, onPick]);

  return null;
}

export function PostLocationPickerInner({
  latitude,
  longitude,
  onChange,
}: PostLocationPickerInnerProps) {
  const [mode, setMode] = useState<PickMode>("center-fixed");
  const markerRef = useRef<L.Marker | null>(null);
  const icon = useMemo(() => markerIcon(), []);

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode("center-fixed")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            mode === "center-fixed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          中央固定（推奨）
        </button>
        <button
          type="button"
          onClick={() => setMode("tap-drop")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            mode === "tap-drop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          タップ配置
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-300 relative">
        <LeafletMapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: 240, width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={20} />
          <CenterSync latitude={latitude} longitude={longitude} mode={mode} />
          <SelectEvents mode={mode} onPick={onChange} />
          <Marker
            ref={(node) => {
              markerRef.current = node;
            }}
            position={[latitude, longitude]}
            icon={icon}
            draggable={mode === "tap-drop"}
            eventHandlers={{
              dragend: () => {
                if (mode !== "tap-drop") return;
                const marker = markerRef.current;
                if (!marker) return;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        </LeafletMapContainer>

        {mode === "center-fixed" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-pink-500/90 bg-white/70 shadow-[0_0_0_6px_rgba(236,72,153,0.15)]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
