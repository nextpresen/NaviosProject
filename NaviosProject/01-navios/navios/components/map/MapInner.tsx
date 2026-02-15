"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer as LeafletMapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Event } from "@/types/event";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/constants";
import { daysUntilText, formatEventSchedule, getEventStatus } from "@/lib/event-status";
import { EventPopup } from "../event/EventPopup";
import { buildMarkerHTML, markerSizeByStatus } from "./MarkerIcon";

interface MapInnerProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent?: (id: string) => void;
  onReady?: (actions: { resetView: () => void; locateMe: () => void }) => void;
  onViewportCenterChange?: (latLng: [number, number]) => void;
}

function FitToEvents({ events }: { events: Event[] }) {
  const map = useMap();

  useEffect(() => {
    if (events.length === 0) return;
    const bounds = L.latLngBounds(events.map((event) => [event.latitude, event.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.2));
  }, [events, map]);

  return null;
}

function FlyToSelected({ events, selectedEventId }: { events: Event[]; selectedEventId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedEventId) return;
    const selected = events.find((event) => event.id === selectedEventId);
    if (!selected) return;
    map.flyTo([selected.latitude, selected.longitude], 16, { duration: 0.6 });
  }, [selectedEventId, events, map]);

  return null;
}

function MapActionsBridge({
  events,
  onReady,
  onLocated,
}: {
  events: Event[];
  onReady?: (actions: { resetView: () => void; locateMe: () => void }) => void;
  onLocated?: (latLng: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onReady) return;

    onReady({
      resetView: () => {
        if (events.length === 0) return;
        const bounds = L.latLngBounds(events.map((event) => [event.latitude, event.longitude] as [number, number]));
        map.flyToBounds(bounds.pad(0.2), { duration: 0.8 });
      },
      locateMe: () => {
        if (!navigator.geolocation) {
          window.alert("このブラウザは位置情報取得に対応していません。");
          return;
        }
        if (!window.isSecureContext) {
          window.alert("位置情報は HTTPS または localhost でのみ利用できます。");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latLng: [number, number] = [position.coords.latitude, position.coords.longitude];
            map.flyTo(latLng, 15, { duration: 1 });
            onLocated?.(latLng);
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              window.alert("位置情報の利用が拒否されました。ブラウザ設定で許可してください。");
              return;
            }
            if (error.code === error.TIMEOUT) {
              window.alert("位置情報の取得がタイムアウトしました。");
              return;
            }
            window.alert("現在地を取得できませんでした。通信環境と端末設定を確認してください。");
          },
          { enableHighAccuracy: true },
        );
      },
    });
  }, [events, map, onLocated, onReady]);

  return null;
}

function ViewportCenterBridge({
  onChange,
}: {
  onChange?: (latLng: [number, number]) => void;
}) {
  const map = useMap();
  const lastSentRef = useRef<[number, number] | null>(null);

  const emitIfChanged = () => {
    if (!onChange) return;
    const center = map.getCenter();
    const next: [number, number] = [center.lat, center.lng];
    const prev = lastSentRef.current;
    if (prev) {
      const latDiff = Math.abs(prev[0] - next[0]);
      const lngDiff = Math.abs(prev[1] - next[1]);
      if (latDiff < 0.00005 && lngDiff < 0.00005) {
        return;
      }
    }
    lastSentRef.current = next;
    onChange(next);
  };

  useEffect(() => {
    emitIfChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, onChange]);

  useEffect(() => {
    if (!onChange) return;
    const onMoveEnd = () => {
      emitIfChanged();
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, onChange]);

  return null;
}

export function MapInner({
  events,
  selectedEventId,
  onSelectEvent,
  onReady,
  onViewportCenterChange,
}: MapInnerProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (events.length > 0) {
      return [events[0].latitude, events[0].longitude];
    }
    return [31.57371, 130.345154];
  }, [events]);

  const clusterIcon = useMemo(
    () => (cluster: { getChildCount: () => number }) => {
      const count = cluster.getChildCount();
      const size = count >= 100 ? 52 : count >= 20 ? 46 : 40;
      const fontSize = count >= 100 ? "13px" : "12px";
      const html = `
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#ffffff;
          font-weight:800;
          font-size:${fontSize};
          background:linear-gradient(135deg,#ec4899,#be185d);
          border:2px solid rgba(255,255,255,.88);
          box-shadow:0 8px 20px rgba(190,24,93,.35);
        ">${count}</div>
      `;

      return L.divIcon({
        html,
        className: "navios-cluster-icon",
        iconSize: [size, size],
      });
    },
    [],
  );

  return (
    <LeafletMapContainer center={center} zoom={14} zoomControl={false} className="w-full h-full">
      <TileLayer url={TILE_URL} maxZoom={20} attribution={TILE_ATTRIBUTION} />

      <MarkerClusterGroup
        chunkedLoading
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        maxClusterRadius={45}
        disableClusteringAtZoom={17}
        iconCreateFunction={clusterIcon}
      >
        {events.map((event) => {
          const status = getEventStatus(event);
          const isSelected = selectedEventId === event.id;
          const avatarUrl =
            event.author_avatar_url ??
            (event.author_id
              ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(event.author_id)}`
              : null);
          const icon = L.divIcon({
            html: buildMarkerHTML(status, event.category, avatarUrl, isSelected),
            className: "",
            ...markerSizeByStatus(status),
          });

          return (
            <Marker
              key={event.id}
              position={[event.latitude, event.longitude]}
              icon={icon}
              zIndexOffset={status === "today" ? 1200 : status === "upcoming" ? 200 : -200}
              eventHandlers={{ click: () => onSelectEvent?.(event.id) }}
            >
              <Popup
                maxWidth={320}
                minWidth={180}
                autoPan
                keepInView
                autoPanPaddingTopLeft={[16, 16]}
                autoPanPaddingBottomRight={[16, 24]}
              >
                <EventPopup
                  id={event.id}
                  title={event.title}
                  content={event.content}
                  imageUrl={event.event_image}
                  dateText={formatEventSchedule(event)}
                  daysText={daysUntilText(event)}
                  status={status}
                />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {currentLocation ? (
        <CircleMarker
          center={currentLocation}
          radius={9}
          pathOptions={{
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Popup>現在地</Popup>
        </CircleMarker>
      ) : null}

      <FitToEvents events={events} />
      <FlyToSelected events={events} selectedEventId={selectedEventId} />
      <MapActionsBridge events={events} onReady={onReady} onLocated={setCurrentLocation} />
      <ViewportCenterBridge onChange={onViewportCenterChange} />
    </LeafletMapContainer>
  );
}
