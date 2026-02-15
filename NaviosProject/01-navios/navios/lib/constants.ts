import type { EventStatus } from "@/types/event";

export const STATUS_CONFIG: Record<
  EventStatus,
  {
    label: string;
    labelShort: string;
    pinClass: string;
    badgeClass: string;
    emoji: string;
    icon: string;
  }
> = {
  today: {
    label: "いまココ",
    labelShort: "NOW",
    pinClass: "pin-today",
    badgeClass: "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white",
    emoji: "🔥",
    icon: "📍",
  },
  upcoming: {
    label: "開催予定",
    labelShort: "SOON",
    pinClass: "pin-upcoming",
    badgeClass: "bg-blue-50 text-blue-700",
    emoji: "📅",
    icon: "📌",
  },
  ended: {
    label: "終了",
    labelShort: "END",
    pinClass: "pin-ended",
    badgeClass: "bg-slate-100 text-slate-500",
    emoji: "🕐",
    icon: "📍",
  },
};

export const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const TILE_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO";
