import {
  EVENT_CATEGORY_VALUES,
  EVENT_TAG_VALUES,
  type EventCategory,
  type EventTag,
} from "@/types/event";

export const EVENT_CATEGORY_OPTIONS: Array<{
  value: EventCategory;
  label: string;
  icon: string;
  color: string;
}> = [
  { value: "sale", label: "セール・特売", icon: "🛍️", color: "#dc2626" },
  { value: "event", label: "イベント", icon: "🎪", color: "#2563eb" },
  { value: "gourmet", label: "グルメ", icon: "🍽️", color: "#ea580c" },
  { value: "household_support", label: "節約・家計支援", icon: "💡", color: "#16a34a" },
  { value: "public_support", label: "公的支援・相談", icon: "🏛️", color: "#0f766e" },
  { value: "local_news", label: "地域ニュース", icon: "📰", color: "#475569" },
];

export const EVENT_TAG_OPTIONS: Array<{
  value: EventTag;
  label: string;
}> = [
  { value: "free", label: "無料" },
  { value: "under_1000", label: "1,000円以下" },
  { value: "go_now", label: "今すぐ行ける" },
];

const CATEGORY_SET = new Set<string>(EVENT_CATEGORY_VALUES);
const TAG_SET = new Set<string>(EVENT_TAG_VALUES);

export function isEventCategory(value: string): value is EventCategory {
  return CATEGORY_SET.has(value);
}

export function isEventTag(value: string): value is EventTag {
  return TAG_SET.has(value);
}

export function toSafeCategory(value: string | null | undefined): EventCategory {
  if (value && isEventCategory(value)) return value;
  return "event";
}

export function normalizeEventTags(value: unknown): EventTag[] {
  if (!Array.isArray(value)) return [];
  const tags = value.filter((item): item is EventTag => typeof item === "string" && isEventTag(item));
  return [...new Set(tags)];
}

export function parseTagsJSON(value: string | null | undefined): EventTag[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return normalizeEventTags(parsed);
  } catch {
    return [];
  }
}

export function stringifyTagsJSON(tags: EventTag[] | undefined): string {
  return JSON.stringify(normalizeEventTags(tags ?? []));
}

export function getCategoryMeta(category: EventCategory) {
  return EVENT_CATEGORY_OPTIONS.find((item) => item.value === category) ?? EVENT_CATEGORY_OPTIONS[1];
}

export function getTagLabel(tag: EventTag) {
  return EVENT_TAG_OPTIONS.find((item) => item.value === tag)?.label ?? tag;
}
