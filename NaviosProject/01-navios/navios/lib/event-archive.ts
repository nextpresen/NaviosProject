import type { Event } from "@/types/event";

export const ARCHIVE_GRACE_HOURS = 24;

function parseEventEnd(event: Event): Date {
  if (event.end_at) return new Date(event.end_at);
  return new Date(`${event.expire_date}T23:59:59`);
}

export function getArchiveCutoff(now = new Date()): Date {
  return new Date(now.getTime() - ARCHIVE_GRACE_HOURS * 60 * 60 * 1000);
}

export function isArchivedEvent(event: Event, now = new Date()): boolean {
  const end = parseEventEnd(event);
  return end < getArchiveCutoff(now);
}

