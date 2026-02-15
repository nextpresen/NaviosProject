"use client";

import { useMemo } from "react";
import { getEventStatus } from "@/lib/event-status";
import type { Event, EventFilter } from "@/types/event";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
}

export function useEvents(events: Event[], filter: EventFilter, searchQuery: string) {
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const order = { today: 0, upcoming: 1, ended: 2 } as const;

    return events
      .filter((event) => {
        const status = getEventStatus(event);
        const matchFilter = filter === "all" || filter === status;
        const matchQuery =
          !q ||
          event.title.toLowerCase().includes(q) ||
          event.content.toLowerCase().includes(q);
        // 検索クエリがある場合は全投稿から検索（フィルター無視）
        if (q) return matchQuery;
        return matchFilter;
      })
      .sort((a, b) => order[getEventStatus(a)] - order[getEventStatus(b)]);
  }, [events, filter, searchQuery]);

  const counts = useMemo(
    () => ({
      all: events.length,
      today: events.filter((event) => getEventStatus(event) === "today").length,
      upcoming: events.filter((event) => getEventStatus(event) === "upcoming").length,
      ended: events.filter((event) => getEventStatus(event) === "ended").length,
    }),
    [events],
  );

  const searchResults: SearchResultItem[] = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    return events
      .filter((event) => {
        return (
          event.title.toLowerCase().includes(q) ||
          event.content.toLowerCase().includes(q)
        );
      })
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        title: event.title,
        subtitle: `${event.content.slice(0, 36)}...`,
      }));
  }, [events, searchQuery]);

  return { filteredEvents, counts, searchResults };
}
