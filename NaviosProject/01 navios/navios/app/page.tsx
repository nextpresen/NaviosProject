"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { EventCardData } from "@/components/event/EventCard";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MapContainer } from "@/components/map/MapContainer";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { MenuDrawer } from "@/components/mobile/MenuDrawer";
import type { SearchResultItem } from "@/components/search/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEvents } from "@/hooks/useEvents";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { daysUntilText, formatDateRange, getEventStatus } from "@/lib/event-status";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { useAppStore } from "@/store/useAppStore";
import type { Event } from "@/types/event";

export default function HomePage() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const filter = useAppStore((state) => state.filter);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const mapStyle = useAppStore((state) => state.mapStyle);
  const isMenuOpen = useAppStore((state) => state.isMenuOpen);
  const isBottomSheetOpen = useAppStore((state) => state.isBottomSheetOpen);

  const setFilter = useAppStore((state) => state.setFilter);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const selectEvent = useAppStore((state) => state.selectEvent);
  const setMapStyle = useAppStore((state) => state.setMapStyle);
  const setMenu = useAppStore((state) => state.setMenu);
  const setBottomSheet = useAppStore((state) => state.setBottomSheet);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        if (!response.ok) {
          setEvents(MOCK_EVENTS);
          return;
        }
        const payload: { events: Event[] } = await response.json();
        setEvents(payload.events ?? []);
      } catch {
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const { filteredEvents, counts, searchResults } = useEvents(
    events,
    filter,
    searchQuery,
  );

  const sidebarEvents: EventCardData[] = useMemo(
    () =>
      filteredEvents.map((event) => ({
        ...event,
        status: getEventStatus(event),
        daysText: daysUntilText(event),
        dateRangeText: formatDateRange(event.event_date, event.expire_date),
      })),
    [filteredEvents],
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const handleSelectEvent = (id: string) => {
    selectEvent(id);
    if (isMobile) {
      setBottomSheet(true);
    }
  };

  const handleSearchSelect = (item: SearchResultItem) => {
    setSearchQuery(item.title);
    selectEvent(item.id);
    if (isMobile) {
      setBottomSheet(true);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slate-100 text-slate-800">
      <Header />
      <MobileHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        searchResultsOpen={searchResults.length > 0}
        onSearchSelect={handleSearchSelect}
        onOpenMenu={() => setMenu(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          searchQuery={searchQuery}
          activeFilter={filter}
          events={sidebarEvents}
          selectedEventId={selectedEventId}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          searchResultsOpen={searchResults.length > 0}
          onSearchSelect={handleSearchSelect}
          onFilterChange={setFilter}
          onSelectEvent={handleSelectEvent}
        />

        <MapContainer
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          stats={{
            total: counts.all,
            today: counts.today,
            upcoming: counts.upcoming,
          }}
          mobileCount={filteredEvents.length}
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setBottomSheet(false)}>
        {selectedEvent ? (
          <div>
            <div className="relative -mx-4 -mt-4 mb-4">
              <Image
                src={selectedEvent.event_image}
                alt={selectedEvent.title}
                width={1200}
                height={768}
                unoptimized
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              <StatusBadge
                status={getEventStatus(selectedEvent)}
                className="absolute top-3 left-3 backdrop-blur-sm shadow"
              />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">
              {selectedEvent.title}
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              📅 {formatDateRange(selectedEvent.event_date, selectedEvent.expire_date)}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              {selectedEvent.content}
            </p>
            <button
              type="button"
              className="w-full bg-slate-900 text-white text-sm font-bold py-3 rounded-xl"
              onClick={() => setBottomSheet(false)}
            >
              閉じる
            </button>
          </div>
        ) : null}
      </BottomSheet>

      <MenuDrawer
        isOpen={isMenuOpen}
        currentFilter={filter}
        mapStyle={mapStyle}
        counts={counts}
        onClose={() => setMenu(false)}
        onChangeFilter={(nextFilter) => {
          setFilter(nextFilter);
          setMenu(false);
        }}
        onChangeStyle={setMapStyle}
      />

      {loading ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000] rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
          loading events...
        </div>
      ) : null}

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .post-card { transition: transform .22s ease, box-shadow .22s ease; }
        .post-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,.12); }
        .post-card.active { border-color: #2a91ff; box-shadow: 0 0 0 3px rgba(42,145,255,.15), 0 12px 28px rgba(15,23,42,.12); }

        .marker-pin { position: relative; width: 44px; height: 56px; display: flex; align-items: flex-start; justify-content: center; filter: drop-shadow(0 3px 6px rgba(15,23,42,.25)); }
        .marker-pin .pin-body { width: 38px; height: 38px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: linear-gradient(135deg,#94a3b8,#64748b); border: 3px solid #fff; display: flex; align-items: center; justify-content: center; }
        .marker-pin .pin-icon { transform: rotate(45deg); font-size: 15px; line-height: 1; }
        .marker-pin .pin-label { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; }

        .marker-pin.pin-today { width: 52px; height: 64px; }
        .marker-pin.pin-today .pin-body { width: 46px; height: 46px; background: linear-gradient(135deg,#f59e0b,#d97706); }
        .marker-pin.pin-today .pin-label { background: linear-gradient(135deg,#dc2626,#b91c1c); color: #fff; }
        .marker-pin.pin-today .pin-pulse { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; border-radius: 50%; background: rgba(245,158,11,.4); animation: markerPulse 1.5s ease-out infinite; }
        .marker-pin.pin-today .pin-glow { position: absolute; inset: -8px; border-radius: 50%; background: radial-gradient(circle, rgba(245,158,11,.2) 0%, transparent 70%); }

        .marker-pin.pin-upcoming .pin-body { background: linear-gradient(135deg,#2a91ff,#0f5ce1); }
        .marker-pin.pin-upcoming .pin-label { background: #dbeafe; color: #1d4ed8; }
        .marker-pin.pin-upcoming .pin-pulse { position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; border-radius: 50%; background: rgba(42,145,255,.35); animation: markerPulse 2s ease-out infinite; }

        .marker-pin.pin-ended { opacity: .55; width: 36px; height: 48px; }
        .marker-pin.pin-ended .pin-body { width: 32px; height: 32px; }
        .marker-pin.pin-ended .pin-label { background: #f1f5f9; color: #94a3b8; }

        @keyframes markerPulse {
          0% { transform: translateX(-50%) scale(1); opacity: .8; }
          100% { transform: translateX(-50%) scale(3.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
