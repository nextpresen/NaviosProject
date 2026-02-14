import type { Event, EventStatus } from "@/types/event";

export function getEventStatus(event: Event): EventStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (event.event_date <= today && event.expire_date >= today) return "today";
  if (event.event_date > today) return "upcoming";
  return "ended";
}

export function daysUntilText(event: Event): string {
  const today = new Date().toISOString().slice(0, 10);
  const status = getEventStatus(event);
  if (status === "today") return "開催中";

  if (status === "upcoming") {
    const diff = Math.ceil(
      (new Date(event.event_date).getTime() - new Date(today).getTime()) / 86400000,
    );
    return `あと${diff}日`;
  }

  const diff = Math.ceil(
    (new Date(today).getTime() - new Date(event.expire_date).getTime()) / 86400000,
  );
  return `${diff}日前に終了`;
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return start === end
    ? fmt(new Date(start))
    : `${fmt(new Date(start))} 〜 ${fmt(new Date(end))}`;
}
