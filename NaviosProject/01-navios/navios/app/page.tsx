"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventCardData } from "@/components/event/EventCard";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MapContainer } from "@/components/map/MapContainer";
import { MenuDrawer } from "@/components/mobile/MenuDrawer";
import { MobileFilterBar } from "@/components/mobile/MobileFilterBar";
import type { SearchResultItem } from "@/components/search/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEvents } from "@/hooks/useEvents";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { daysUntilText, formatEventSchedule, getEventStatus } from "@/lib/event-status";
import { getClientMapProvider } from "@/lib/map-provider";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { useAppStore } from "@/store/useAppStore";
import type { Event } from "@/types/event";

export default function HomePage() {
  const mapProvider = getClientMapProvider();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPcCardPopupOpen, setPcCardPopupOpen] = useState(false);

  const filter = useAppStore((state) => state.filter);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const isMenuOpen = useAppStore((state) => state.isMenuOpen);

  const setFilter = useAppStore((state) => state.setFilter);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const selectEvent = useAppStore((state) => state.selectEvent);
  const setMenu = useAppStore((state) => state.setMenu);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        if (!response.ok) {
          setEvents(MOCK_EVENTS);
          return;
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          events?: Event[];
          data?: { events?: Event[] };
        };
        setEvents(payload.events ?? payload.data?.events ?? []);
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
        dateRangeText: formatEventSchedule(event),
      })),
    [filteredEvents],
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const handleSelectEventFromMap = (id: string) => {
    selectEvent(id);
    if (isMobile) {
      setPcCardPopupOpen(false);
      return;
    }
    setPcCardPopupOpen(true);
  };

  const handleSelectEventFromSidebar = (id: string) => {
    selectEvent(id);
    if (isMobile) return;
    setPcCardPopupOpen(true);
  };

  const handleSearchSelect = (item: SearchResultItem) => {
    setSearchQuery(item.title);
    selectEvent(item.id);
    setPcCardPopupOpen(false);
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

      <div className="flex-1 flex overflow-hidden relative">
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
          onSelectEvent={handleSelectEventFromSidebar}
        />

        <MapContainer
          stats={{
            total: counts.all,
            today: counts.today,
            upcoming: counts.upcoming,
          }}
          enableMarkerPopup={isMobile}
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEventFromMap}
        />

        {isMobile && (
          <MobileFilterBar
            activeFilter={filter}
            counts={counts}
            onChange={setFilter}
          />
        )}
      </div>

      {!isMobile && isPcCardPopupOpen && selectedEvent ? (
        <div className="hidden lg:block absolute right-6 bottom-6 z-[1300] w-[340px]">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl">
            <div className="relative">
              <Image
                src={selectedEvent.event_image}
                alt={selectedEvent.title}
                width={1200}
                height={768}
                unoptimized
                className="w-full h-40 object-cover bg-slate-100"
              />
              <StatusBadge
                status={getEventStatus(selectedEvent)}
                className="absolute top-3 left-3 backdrop-blur-sm shadow"
              />
              <button
                type="button"
                aria-label="close card popup"
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/90 text-slate-700 text-xs font-bold shadow"
                onClick={() => setPcCardPopupOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                {selectedEvent.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                📅 {formatEventSchedule(selectedEvent)}
              </p>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                {selectedEvent.content}
              </p>
              <Link
                href={`/event/${selectedEvent.id}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 border border-slate-300 transition shadow-sm"
              >
                詳細を見る
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setMenu(false)}
      />

      {loading ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000] rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
          loading events...
        </div>
      ) : null}

      {mapProvider === "leaflet" ? (
        <style jsx global>{`
        /* ポップアップが地図コンテナからはみ出しても見切れないようにする */
        .leaflet-pane { overflow: visible !important; }
        .leaflet-popup { z-index: 1100 !important; }
        .leaflet-popup-content-wrapper { overflow: visible !important; border-radius: 12px !important; box-shadow: 0 8px 30px rgba(15,23,42,.18) !important; }
        .leaflet-popup-content { margin: 0 !important; padding: 0 !important; }
        .leaflet-popup-tip-container { z-index: 1100; }

        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 999px; }
        .post-card { transition: transform .22s ease, box-shadow .22s ease; }
        .post-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15,23,42,.10); }
        .post-card.active { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15), 0 12px 28px rgba(15,23,42,.10); }

        .marker-pin { position: relative; width: 44px; height: 56px; display: flex; align-items: flex-start; justify-content: center; filter: drop-shadow(0 4px 8px rgba(15,23,42,.26)); }
        .marker-pin .pin-body { width: 38px; height: 38px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: var(--pin-category-color, #2a91ff); border: 2px solid rgba(255,255,255,.95); display: flex; align-items: center; justify-content: center; position: relative; overflow: visible; }
        .marker-pin .pin-glyph { transform: rotate(45deg); font-size: 16px; line-height: 1; filter: drop-shadow(0 1px 0 rgba(0,0,0,.14)); }
        .marker-pin .pin-selected-avatar { position: absolute; right: -6px; bottom: -6px; width: 18px; height: 18px; border-radius: 999px; border: 2px solid #fff; background: #f8fafc; overflow: hidden; transform: rotate(45deg); box-shadow: 0 2px 6px rgba(15,23,42,.25); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; line-height: 1; }
        .marker-pin .pin-selected-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; transform: rotate(-45deg); }
        .marker-pin .pin-selected-avatar-fallback { color: #475569; }
        .marker-pin .pin-label { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; white-space: nowrap; }
        .marker-pin .pin-pulse { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; animation: markerPulse 1.5s ease-out infinite; }
        .marker-pin .pin-glow { position: absolute; inset: -8px; border-radius: 50%; }

        .marker-pin.pin-today { width: 52px; height: 64px; }
        .marker-pin.pin-today .pin-body { width: 46px; height: 46px; }
        .marker-pin.pin-today .pin-glyph { font-size: 19px; }
        .marker-pin.pin-today .pin-selected-avatar { width: 20px; height: 20px; right: -7px; bottom: -7px; }
        .marker-pin.pin-today .pin-label { top: -16px; background: linear-gradient(135deg,#f472b6,#db2777); color: #fff; }
        .marker-pin.pin-today .pin-pulse { background: rgba(236,72,153,.45); }
        .marker-pin.pin-today .pin-glow { background: radial-gradient(circle, rgba(236,72,153,.24) 0%, transparent 70%); }

        .marker-pin.pin-upcoming { opacity: .82; transform: scale(.96); transform-origin: center bottom; }
        .marker-pin.pin-upcoming .pin-label { background: #dbeafe; color: #1d4ed8; }
        .marker-pin.pin-upcoming .pin-pulse { background: rgba(42,145,255,.35); }
        .marker-pin.pin-upcoming .pin-glow { background: radial-gradient(circle, rgba(42,145,255,.2) 0%, transparent 70%); }

        .marker-pin.pin-ended { opacity: .38; width: 36px; height: 48px; transform: scale(.92); transform-origin: center bottom; filter: grayscale(.25); }
        .marker-pin.pin-ended .pin-body { width: 32px; height: 32px; }
        .marker-pin.pin-ended .pin-glyph { font-size: 14px; }
        .marker-pin.pin-ended .pin-selected-avatar { width: 15px; height: 15px; right: -5px; bottom: -5px; border-width: 1.5px; font-size: 9px; }
        .marker-pin.pin-ended .pin-label { background: #f1f5f9; color: #94a3b8; }
        .marker-pin.pin-ended .pin-pulse { background: rgba(148,163,184,.35); }
        .marker-pin.pin-ended .pin-glow { background: radial-gradient(circle, rgba(148,163,184,.2) 0%, transparent 70%); }

        @keyframes markerPulse {
          0% { transform: translateX(-50%) scale(1); opacity: .8; }
          100% { transform: translateX(-50%) scale(3.5); opacity: 0; }
        }

        .my-location-marker { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .my-location-dot { width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(59,130,246,.45); z-index: 2; }
        .my-location-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid rgba(59,130,246,.35); animation: locationPulse 2.5s ease-out infinite; z-index: 1; }
        @keyframes locationPulse {
          0% { transform: scale(.6); opacity: .8; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
      ) : null}
    </div>
  );
}
