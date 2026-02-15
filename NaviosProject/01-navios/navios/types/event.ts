export const EVENT_CATEGORY_VALUES = [
  "sale",
  "event",
  "gourmet",
  "household_support",
  "public_support",
  "local_news",
] as const;

export type EventCategory = (typeof EVENT_CATEGORY_VALUES)[number];

export const EVENT_TAG_VALUES = [
  "free",
  "under_1000",
  "go_now",
] as const;

export type EventTag = (typeof EVENT_TAG_VALUES)[number];

export interface Event {
  id: string;
  title: string;
  content: string;
  author_id?: string | null;
  author_avatar_url?: string | null;
  category: EventCategory;
  latitude: number;
  longitude: number;
  event_date: string;
  expire_date: string;
  event_image: string;
  tags: EventTag[];
}

export type EventStatus = "today" | "upcoming" | "ended";

export type EventFilter = "all" | EventStatus;
