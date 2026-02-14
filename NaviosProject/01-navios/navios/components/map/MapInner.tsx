"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer as LeafletMapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Event } from "@/types/event";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/constants";
import { daysUntilText, formatDateRange, getEventStatus } from "@/lib/event-status";
import { EventPopup } from "../event/EventPopup";
import { buildMarkerHTML, markerSizeByStatus } from "./MarkerIcon";

interface MapInnerProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent?: (id: string) => void;
  onReady?: (actions: { resetView: () => void; locateMe: () => void }) => void;
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

export function MapInner({ events, selectedEventId, onSelectEvent, onReady }: MapInnerProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (events.length > 0) {
      return [events[0].latitude, events[0].longitude];
    }
    return [31.57371, 130.345154];
  }, [events]);

  return (
    <LeafletMapContainer center={center} zoom={14} zoomControl={false} className="w-full h-full">
      <TileLayer url={TILE_URL} maxZoom={20} attribution={TILE_ATTRIBUTION} />

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
            zIndexOffset={status === "today" ? 1000 : status === "upcoming" ? 500 : 0}
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
                dateText={formatDateRange(event.event_date, event.expire_date)}
                daysText={daysUntilText(event)}
                status={status}
              />
            </Popup>
          </Marker>
        );
      })}

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
    </LeafletMapContainer>
  );
}
