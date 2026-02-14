"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer as LeafletMapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Event, MapStyle } from "@/types/event";
import { TILE_ATTRIBUTION, TILE_URLS } from "@/lib/constants";
import { daysUntilText, formatDateRange, getEventStatus } from "@/lib/event-status";
import { EventPopup } from "../event/EventPopup";
import { buildMarkerHTML, markerSizeByStatus } from "./MarkerIcon";

interface MapInnerProps {
  events: Event[];
  selectedEventId: string | null;
  mapStyle: MapStyle;
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

function MapActionsBridge({ events, onReady }: { events: Event[]; onReady?: (actions: { resetView: () => void; locateMe: () => void }) => void }) {
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
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            map.flyTo([position.coords.latitude, position.coords.longitude], 15, { duration: 1 });
          },
          () => {},
          { enableHighAccuracy: true },
        );
      },
    });
  }, [events, map, onReady]);

  return null;
}

export function MapInner({ events, selectedEventId, mapStyle, onSelectEvent, onReady }: MapInnerProps) {
  const center = useMemo<[number, number]>(() => {
    if (events.length > 0) {
      return [events[0].latitude, events[0].longitude];
    }
    return [31.57371, 130.345154];
  }, [events]);

  return (
    <LeafletMapContainer center={center} zoom={14} zoomControl={false} className="w-full h-full">
      <TileLayer url={TILE_URLS[mapStyle]} maxZoom={20} attribution={TILE_ATTRIBUTION} />

      {events.map((event) => {
        const status = getEventStatus(event);
        const icon = L.divIcon({
          html: buildMarkerHTML(status),
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
            <Popup maxWidth={300}>
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

      <FitToEvents events={events} />
      <FlyToSelected events={events} selectedEventId={selectedEventId} />
      <MapActionsBridge events={events} onReady={onReady} />
    </LeafletMapContainer>
  );
}
