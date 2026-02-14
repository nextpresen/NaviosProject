export interface Event {
  id: string;
  title: string;
  content: string;
  author_id?: string | null;
  latitude: number;
  longitude: number;
  event_date: string;
  expire_date: string;
  event_image: string;
}

export type EventStatus = "today" | "upcoming" | "ended";

export type EventFilter = "all" | EventStatus;
