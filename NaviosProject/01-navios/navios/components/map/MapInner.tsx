"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer as LeafletMapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Event } from "@/types/event";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/constants";
import { daysUntilText, formatEventSchedule, getEventStatus } from "@/lib/event-status";
import { EventPopup } from "../event/EventPopup";
import { buildMarkerHTML, markerSizeByStatus } from "./MarkerIcon";

interface MapInnerProps {
  events: Event[];
  selectedEventId: string | null;
  enableMarkerPopup?: boolean;
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
  currentLocation,
  onReady,
  onLocated,
}: {
  events: Event[];
  currentLocation: [number, number] | null;
  onReady?: (actions: { resetView: () => void; locateMe: () => void }) => void;
  onLocated?: (latLng: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onReady) return;

    onReady({
      resetView: () => {
        const points: [number, number][] = events.map((event) => [event.latitude, event.longitude]);
        if (currentLocation) points.push(currentLocation);
        if (points.length === 0) return;
        const bounds = L.latLngBounds(points);
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
  }, [events, currentLocation, map, onLocated, onReady]);

  return null;
}

/**
 * ポップアップが開いたときに地図をパンして全体が画面内に収まるようにする。
 * Leaflet 組み込みの autoPan が先に走るので、その完了後（300ms 待機）に
 * まだはみ出していれば追加パンで補正する。
 */
function PopupAutoFit() {
  const map = useMap();

  useEffect(() => {
    const onPopupOpen = (e: L.PopupEvent) => {
      const popup = e.popup;

      // Leaflet の autoPan アニメーション完了を待ってから補正
      setTimeout(() => {
        const popupNode = popup.getElement();
        if (!popupNode) return;

        const rect = popupNode.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();

        // ヘッダーやUI要素を考慮したパディング
        const padTop = 80;     // ヘッダー分
        const padBottom = 48;  // モバイル下部余白
        const padLeft = 20;
        const padRight = 20;

        let dx = 0;
        let dy = 0;

        // 上にはみ出し
        if (rect.top < mapRect.top + padTop) {
          dy = rect.top - (mapRect.top + padTop);
        }
        // 下にはみ出し
        if (rect.bottom > mapRect.bottom - padBottom) {
          dy = rect.bottom - (mapRect.bottom - padBottom);
        }
        // 左にはみ出し
        if (rect.left < mapRect.left + padLeft) {
          dx = rect.left - (mapRect.left + padLeft);
        }
        // 右にはみ出し
        if (rect.right > mapRect.right - padRight) {
          dx = rect.right - (mapRect.right - padRight);
        }

        if (dx !== 0 || dy !== 0) {
          map.panBy([dx, dy], { animate: true, duration: 0.25 });
        }
      }, 350);
    };

    map.on("popupopen", onPopupOpen);
    return () => {
      map.off("popupopen", onPopupOpen);
    };
  }, [map]);

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
  enableMarkerPopup = true,
  onSelectEvent,
  onReady,
  onViewportCenterChange,
}: MapInnerProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const markerRefs = useRef(new Map<string, L.Marker>());

  const center = useMemo<[number, number]>(() => {
    if (events.length > 0) {
      return [events[0].latitude, events[0].longitude];
    }
    return [31.57371, 130.345154];
  }, [events]);

  useEffect(() => {
    if (!enableMarkerPopup) return;
    if (!selectedEventId) return;
    const marker = markerRefs.current.get(selectedEventId);
    if (!marker) return;
    marker.openPopup();
  }, [enableMarkerPopup, selectedEventId]);

  return (
    <LeafletMapContainer center={center} zoom={14} zoomControl={false} className="w-full h-full">
      <TileLayer url={TILE_URL} maxZoom={20} attribution={TILE_ATTRIBUTION} />

      {events.map((event) => {
        const status = getEventStatus(event);
        const avatarUrl =
          event.author_avatar_url ??
          (event.author_id
            ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(event.author_id)}`
            : null);
        const icon = L.divIcon({
          html: buildMarkerHTML(status, event.category, avatarUrl, false),
          className: "",
          ...markerSizeByStatus(status),
        });

        return (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={icon}
            zIndexOffset={status === "today" ? 1200 : status === "upcoming" ? 200 : -200}
            ref={(instance) => {
              if (instance) {
                markerRefs.current.set(event.id, instance);
              } else {
                markerRefs.current.delete(event.id);
              }
            }}
            eventHandlers={{
              click: (clickEvent) => {
                onSelectEvent?.(event.id);
                if (!enableMarkerPopup) return;
                const marker = clickEvent.target as L.Marker;
                requestAnimationFrame(() => marker.openPopup());
              },
            }}
          >
            {enableMarkerPopup ? (
              <Popup
                maxWidth={380}
                minWidth={240}
                autoPan
                keepInView
                autoPanPaddingTopLeft={[28, 116]}
                autoPanPaddingBottomRight={[28, 132]}
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
            ) : null}
          </Marker>
        );
      })}

      {currentLocation ? (
        <Marker
          position={currentLocation}
          zIndexOffset={500}
          icon={L.divIcon({
            html: '<div class="my-location-marker"><div class="my-location-dot"></div><div class="my-location-ring"></div></div>',
            className: "",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>現在地</Popup>
        </Marker>
      ) : null}

      <FitToEvents events={events} />
      <FlyToSelected events={events} selectedEventId={selectedEventId} />
      <MapActionsBridge events={events} currentLocation={currentLocation} onReady={onReady} onLocated={setCurrentLocation} />
      <ViewportCenterBridge onChange={onViewportCenterChange} />
      {enableMarkerPopup ? <PopupAutoFit /> : null}
    </LeafletMapContainer>
  );
}
