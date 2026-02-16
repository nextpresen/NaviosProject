import type { Event } from "@/types/event";
import { parseTagsJSON, toSafeCategory } from "@/lib/event-taxonomy";

type EventRow = {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  author_avatar_url: string | null;
  category: string;
  latitude: number;
  longitude: number;
  address: string | null;
  start_at: Date | null;
  end_at: Date | null;
  is_all_day: boolean;
  event_date: Date;
  expire_date: Date;
  event_image: string;
  tags_json: string;
  view_count: number;
  popularity_score: number;
};

export function toEvent(input: EventRow): Event {
  const startAt = input.start_at ?? new Date(`${input.event_date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const endAt = input.end_at ?? new Date(`${input.expire_date.toISOString().slice(0, 10)}T23:59:59.000Z`);
  return {
    id: input.id,
    title: input.title,
    content: input.content,
    author_id: input.author_id,
    author_avatar_url: input.author_avatar_url,
    category: toSafeCategory(input.category),
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    is_all_day: input.is_all_day ?? false,
    event_date: input.event_date.toISOString().slice(0, 10),
    expire_date: input.expire_date.toISOString().slice(0, 10),
    event_image: input.event_image,
    tags: parseTagsJSON(input.tags_json),
    view_count: input.view_count,
    popularity_score: input.popularity_score,
  };
}
