import type { Event, EventStatus } from "@/types/event";

function parseEventStart(event: Event): Date {
  if (event.start_at) return new Date(event.start_at);
  return new Date(`${event.event_date}T00:00:00`);
}

function parseEventEnd(event: Event): Date {
  if (event.end_at) return new Date(event.end_at);
  return new Date(`${event.expire_date}T23:59:59`);
}

export function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  const start = parseEventStart(event);
  const end = parseEventEnd(event);

  if (now >= start && now <= end) return "today";
  if (now < start) return "upcoming";
  return "ended";
}

export function daysUntilText(event: Event): string {
  const now = new Date();
  const status = getEventStatus(event);
  if (status === "today") return "開催中";

  if (status === "upcoming") {
    const diff = Math.ceil((parseEventStart(event).getTime() - now.getTime()) / 86400000);
    return `あと${diff}日`;
  }

  const diff = Math.ceil((now.getTime() - parseEventEnd(event).getTime()) / 86400000);
  return `${diff}日前に終了`;
}

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTimeLabel(date: Date) {
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDateRange(start: string, end: string, isAllDay = false): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (isAllDay) {
    return sameDay
      ? `${formatDateLabel(startDate)} 終日`
      : `${formatDateLabel(startDate)} 〜 ${formatDateLabel(endDate)} 終日`;
  }

  if (sameDay) {
    return `${formatDateLabel(startDate)} ${formatTimeLabel(startDate)}〜${formatTimeLabel(endDate)}`;
  }

  return `${formatDateLabel(startDate)} ${formatTimeLabel(startDate)} 〜 ${formatDateLabel(endDate)} ${formatTimeLabel(endDate)}`;
}

export function formatEventSchedule(event: Event): string {
  const start = event.start_at || `${event.event_date}T00:00:00`;
  const end = event.end_at || `${event.expire_date}T23:59:59`;
  return formatDateRange(start, end, event.is_all_day);
}
