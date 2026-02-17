"use client";

import { EventCard, type EventCardData } from "../event/EventCard";
import { SearchInput, type SearchResultItem } from "../search/SearchInput";
import { FilterTabs, type FilterType } from "../ui/FilterTabs";

interface SidebarProps {
  searchQuery: string;
  activeFilter: FilterType;
  events: EventCardData[];
  popularPastEvents?: EventCardData[];
  selectedEventId?: string | null;
  onSearchChange?: (value: string) => void;
  searchResults?: SearchResultItem[];
  searchResultsOpen?: boolean;
  onSearchSelect?: (item: SearchResultItem) => void;
  onFilterChange?: (filter: FilterType) => void;
  onSelectEvent?: (id: string) => void;
}

export function Sidebar({
  searchQuery,
  activeFilter,
  events,
  popularPastEvents = [],
  selectedEventId,
  onSearchChange,
  searchResults = [],
  searchResultsOpen = false,
  onSearchSelect,
  onFilterChange,
  onSelectEvent,
}: SidebarProps) {
  const liveNowEvents = events.filter((event) => event.status === "today");
  const upcomingEvents = events.filter((event) => event.status === "upcoming");
  const endedEvents = events.filter((event) => event.status === "ended");
  const showCollapsedSections = activeFilter === "all";

  return (
    <aside className="hidden lg:flex flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200/60 overflow-hidden w-[380px] flex-shrink-0">
      <div className="flex-shrink-0 p-4 border-b border-slate-200/40">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          results={searchResults}
          resultsOpen={searchResultsOpen}
          onSelectResult={onSearchSelect}
        />
        <FilterTabs activeFilter={activeFilter} onChange={onFilterChange} />
      </div>

      <div className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/40">
        <p className="text-xs text-slate-400 font-medium">
          <span className="text-slate-700 font-bold">{events.length}</span> イベント
        </p>
      </div>

      {showCollapsedSections ? (
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3">
          <section className="space-y-2.5">
            <div className="px-1 flex items-center justify-between">
              <p className="text-[11px] font-extrabold tracking-wide text-pink-600">LIVE NOW</p>
              <span className="text-[11px] font-semibold text-pink-500">{liveNowEvents.length}</span>
            </div>
            {liveNowEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                active={selectedEventId === event.id}
                onClick={onSelectEvent}
              />
            ))}
          </section>

          <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
            <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>SOON</span>
              <span className="text-slate-400">{upcomingEvents.length}</span>
            </summary>
            <div className="mt-2 space-y-2.5">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  active={selectedEventId === event.id}
                  onClick={onSelectEvent}
                />
              ))}
            </div>
          </details>

          <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
            <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>FINISHED</span>
              <span className="text-slate-400">{endedEvents.length}</span>
            </summary>
            <div className="mt-2 space-y-2.5">
              {endedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  active={selectedEventId === event.id}
                  onClick={onSelectEvent}
                />
              ))}
            </div>
          </details>

          <details className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2" open={popularPastEvents.length > 0}>
            <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-bold text-amber-700">
              <span>PAST POPULAR</span>
              <span className="text-amber-600">{popularPastEvents.length}</span>
            </summary>
            <div className="mt-2 space-y-2.5">
              {popularPastEvents.length === 0 ? (
                <p className="px-1 text-[11px] text-slate-500">表示できる過去人気イベントはまだありません。</p>
              ) : (
                popularPastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    active={selectedEventId === event.id}
                    onClick={onSelectEvent}
                  />
                ))
              )}
            </div>
          </details>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2.5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              active={selectedEventId === event.id}
              onClick={onSelectEvent}
            />
          ))}
          {popularPastEvents.length > 0 ? (
            <section className="mt-3 space-y-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
              <div className="px-1 flex items-center justify-between">
                <p className="text-[11px] font-extrabold tracking-wide text-amber-700">PAST POPULAR</p>
                <span className="text-[11px] font-semibold text-amber-600">{popularPastEvents.length}</span>
              </div>
              {popularPastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  active={selectedEventId === event.id}
                  onClick={onSelectEvent}
                />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </aside>
  );
}
