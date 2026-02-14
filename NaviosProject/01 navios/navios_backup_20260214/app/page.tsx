"use client";

import { useMemo, useState } from "react";
import type { EventCardData } from "../components/event/EventCard";
import { Header } from "../components/layout/Header";
import { MobileHeader } from "../components/layout/MobileHeader";
import { Sidebar } from "../components/layout/Sidebar";
import { MapContainer } from "../components/map/MapContainer";
import { EventMarker } from "../components/map/EventMarker";
import { BottomSheet } from "../components/mobile/BottomSheet";
import { MenuDrawer } from "../components/mobile/MenuDrawer";
import type { SearchResultItem } from "../components/search/SearchInput";
import type { FilterType } from "../components/ui/FilterTabs";
import type { EventStatus } from "../components/ui/StatusBadge";
import type { MapStyle } from "../components/map/MapStyleToggle";
import { StatusBadge } from "../components/ui/StatusBadge";

interface EventData {
  id: string;
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  event_date: string;
  expire_date: string;
  event_image: string;
}

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const MOCK_EVENTS: EventData[] = [
  {
    id: "evt-001",
    title: "日置市 春の花まつり 2026",
    content:
      "日置市最大級の春祭り。地元の屋台が50店舗以上出店し、ステージでは郷土芸能やライブ演奏が楽しめます。家族連れにもおすすめ。",
    latitude: 31.5745,
    longitude: 130.3418,
    event_date: isoDate(0),
    expire_date: isoDate(0),
    event_image: "https://placehold.co/800x480/f59e0b/ffffff?text=Spring+Festival",
  },
  {
    id: "evt-002",
    title: "吉利の丘 夕焼けフォトウォーク",
    content:
      "写真愛好家のための撮影イベント。プロカメラマンが同行し、夕焼けの撮影テクニックを教わりながら絶景スポットを巡ります。",
    latitude: 31.57371,
    longitude: 130.345154,
    event_date: isoDate(0),
    expire_date: isoDate(0),
    event_image: "https://placehold.co/800x480/ef4444/ffffff?text=Photo+Walk",
  },
  {
    id: "evt-003",
    title: "隠れ家カフェ 木漏れ日 特別ランチ会",
    content:
      "地元農家から直送の旬の野菜を使った特別コースランチ。限定20名の予約制イベントです。テラス席から日置の山々を一望。",
    latitude: 31.5751,
    longitude: 130.348,
    event_date: isoDate(2),
    expire_date: isoDate(2),
    event_image: "https://placehold.co/800x480/22c55e/ffffff?text=Special+Lunch",
  },
  {
    id: "evt-004",
    title: "日吉古道ナイトハイク",
    content:
      "満月の夜に開催される特別なハイキングイベント。ガイド付きで歴史ある石畳の古道を月明かりの下で歩きます。ヘッドランプ貸出あり。",
    latitude: 31.5718,
    longitude: 130.343,
    event_date: isoDate(5),
    expire_date: isoDate(5),
    event_image: "https://placehold.co/800x480/6366f1/ffffff?text=Night+Hike",
  },
  {
    id: "evt-005",
    title: "吉利川 桜ライトアップ",
    content:
      "川沿いの桜並木を幻想的にライトアップ。屋台の出店や地元ミュージシャンの演奏もあり。期間中毎日18:00〜21:00開催。",
    latitude: 31.5722,
    longitude: 130.3465,
    event_date: isoDate(-3),
    expire_date: isoDate(-1),
    event_image: "https://placehold.co/800x480/ec4899/ffffff?text=Sakura+Light",
  },
  {
    id: "evt-006",
    title: "漁港朝市 海鮮BBQフェス",
    content:
      "毎月恒例の朝市に加え、今回は海鮮BBQ特別企画。朝獲れの新鮮な魚介を自分で焼いて楽しめます。朝6:00スタート。",
    latitude: 31.576,
    longitude: 130.3502,
    event_date: isoDate(-10),
    expire_date: isoDate(-10),
    event_image: "https://placehold.co/800x480/f97316/ffffff?text=Seafood+BBQ",
  },
];

function getEventStatus(event: EventData): EventStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (event.event_date <= today && event.expire_date >= today) return "today";
  if (event.event_date > today) return "upcoming";
  return "ended";
}

function daysUntilText(event: EventData): string {
  const today = new Date().toISOString().slice(0, 10);
  const status = getEventStatus(event);
  if (status === "today") return "開催中";

  if (status === "upcoming") {
    const diff = Math.ceil((new Date(event.event_date).getTime() - new Date(today).getTime()) / 86400000);
    return `あと${diff}日`;
  }

  const diff = Math.ceil((new Date(today).getTime() - new Date(event.expire_date).getTime()) / 86400000);
  return `${diff}日前に終了`;
}

function formatDateRange(start: string, end: string): string {
  const format = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return start === end ? format(new Date(start)) : `${format(new Date(start))} 〜 ${format(new Date(end))}`;
}

const MARKER_POSITIONS = [
  { left: "42%", top: "44%" },
  { left: "49%", top: "40%" },
  { left: "54%", top: "47%" },
  { left: "58%", top: "35%" },
  { left: "46%", top: "53%" },
  { left: "38%", top: "38%" },
];

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [mapStyle, setMapStyle] = useState<MapStyle>("voyager");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const order: Record<EventStatus, number> = { today: 0, upcoming: 1, ended: 2 };

    return MOCK_EVENTS.filter((event) => {
      const status = getEventStatus(event);
      const hitStatus = activeFilter === "all" || activeFilter === status;
      const hitQuery = !query || event.title.toLowerCase().includes(query) || event.content.toLowerCase().includes(query);
      return hitStatus && hitQuery;
    }).sort((a, b) => order[getEventStatus(a)] - order[getEventStatus(b)]);
  }, [activeFilter, searchQuery]);

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

  const counts = useMemo(
    () => ({
      all: MOCK_EVENTS.length,
      today: MOCK_EVENTS.filter((event) => getEventStatus(event) === "today").length,
      upcoming: MOCK_EVENTS.filter((event) => getEventStatus(event) === "upcoming").length,
      ended: MOCK_EVENTS.filter((event) => getEventStatus(event) === "ended").length,
    }),
    [],
  );

  const selectedEvent = useMemo(() => MOCK_EVENTS.find((event) => event.id === selectedEventId) ?? null, [selectedEventId]);

  const searchResults: SearchResultItem[] = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase();
    return MOCK_EVENTS.filter((event) => event.title.toLowerCase().includes(query) || event.content.toLowerCase().includes(query))
      .slice(0, 5)
      .map((event) => ({ id: event.id, title: event.title, subtitle: event.content.slice(0, 36) + "..." }));
  }, [searchQuery]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches) {
      setIsBottomSheetOpen(true);
    }
  };

  const handleSearchSelect = (item: SearchResultItem) => {
    setSearchQuery(item.title);
    setSelectedEventId(item.id);
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
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          events={sidebarEvents}
          selectedEventId={selectedEventId}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          searchResultsOpen={searchResults.length > 0}
          onSearchSelect={handleSearchSelect}
          onFilterChange={setActiveFilter}
          onSelectEvent={handleSelectEvent}
        />

        <MapContainer
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          stats={{ total: counts.all, today: counts.today, upcoming: counts.upcoming }}
          mobileCount={sidebarEvents.length}
          mapSlot={
            <div
              className={`relative w-full h-full ${
                mapStyle === "dark"
                  ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-700"
                  : mapStyle === "light"
                    ? "bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200"
                    : "bg-gradient-to-br from-blue-100 via-sky-50 to-emerald-100"
              }`}
            >
              <div className="absolute inset-0 opacity-30 [background-size:24px_24px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.24)_1px,transparent_1px)]" />

              {filteredEvents.map((event, index) => {
                const position = MARKER_POSITIONS[index % MARKER_POSITIONS.length];
                const status = getEventStatus(event);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleSelectEvent(event.id)}
                    className="absolute -translate-x-1/2 -translate-y-full"
                    style={position}
                  >
                    <EventMarker status={status} />
                  </button>
                );
              })}
            </div>
          }
        />
      </div>

      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)}>
        {selectedEvent ? (
          <div>
            <div className="relative -mx-4 -mt-4 mb-4">
              <img src={selectedEvent.event_image} alt={selectedEvent.title} className="w-full h-48 object-cover rounded-t-2xl" />
              <StatusBadge status={getEventStatus(selectedEvent)} className="absolute top-3 left-3 backdrop-blur-sm shadow" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">{selectedEvent.title}</h2>
            <p className="text-xs text-slate-500 mb-3">📅 {formatDateRange(selectedEvent.event_date, selectedEvent.expire_date)}</p>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">{selectedEvent.content}</p>
            <button
              type="button"
              className="w-full bg-slate-900 text-white text-sm font-bold py-3 rounded-xl"
              onClick={() => setIsBottomSheetOpen(false)}
            >
              閉じる
            </button>
          </div>
        ) : null}
      </BottomSheet>

      <MenuDrawer
        isOpen={isMenuOpen}
        currentFilter={activeFilter}
        mapStyle={mapStyle}
        counts={counts}
        onClose={() => setIsMenuOpen(false)}
        onChangeFilter={(filter) => {
          setActiveFilter(filter);
          setIsMenuOpen(false);
        }}
        onChangeStyle={setMapStyle}
      />

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .post-card { transition: transform .22s ease, box-shadow .22s ease; }
        .post-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,.12); }
        .post-card.active { border-color: #2a91ff; box-shadow: 0 0 0 3px rgba(42,145,255,.15), 0 12px 28px rgba(15,23,42,.12); }

        .marker-pin { position: relative; width: 44px; height: 56px; display: flex; align-items: flex-start; justify-content: center; }
        .marker-pin .pin-body { width: 38px; height: 38px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: linear-gradient(135deg,#94a3b8,#64748b); border: 3px solid #fff; display: flex; align-items: center; justify-content: center; }
        .marker-pin .pin-icon { transform: rotate(45deg); font-size: 15px; line-height: 1; }
        .marker-pin .pin-label { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; }

        .marker-pin.pin-today { width: 52px; height: 64px; }
        .marker-pin.pin-today .pin-body { width: 46px; height: 46px; background: linear-gradient(135deg,#f59e0b,#d97706); }
        .marker-pin.pin-today .pin-label { background: linear-gradient(135deg,#dc2626,#b91c1c); color: #fff; }
        .marker-pin.pin-upcoming .pin-body { background: linear-gradient(135deg,#2a91ff,#0f5ce1); }
        .marker-pin.pin-upcoming .pin-label { background: #dbeafe; color: #1d4ed8; }
        .marker-pin.pin-ended { opacity: .55; width: 36px; height: 48px; }
        .marker-pin.pin-ended .pin-body { width: 32px; height: 32px; }
        .marker-pin.pin-ended .pin-label { background: #f1f5f9; color: #94a3b8; }
      `}</style>
    </div>
  );
}
