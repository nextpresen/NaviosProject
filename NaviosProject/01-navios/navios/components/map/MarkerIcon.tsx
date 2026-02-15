import type { EventStatus } from "../ui/StatusBadge";
import type { EventCategory } from "@/types/event";
import { getCategoryMeta } from "@/lib/event-taxonomy";

const PIN_CONFIG = {
  today: { pinClass: "pin-today", short: "LIVE NOW" },
  upcoming: { pinClass: "pin-upcoming", short: "SOON" },
  ended: { pinClass: "pin-ended", short: "FINISHED" },
} as const;

function escapeAttr(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function buildMarkerHTML(
  status: EventStatus,
  category: EventCategory,
  authorAvatarUrl?: string | null,
  isSelected = false,
) {
  const cfg = PIN_CONFIG[status];
  const categoryConfig = getCategoryMeta(category);
  const safeCategoryLabel = escapeAttr(categoryConfig.label);
  const safeAvatar = authorAvatarUrl ? escapeAttr(authorAvatarUrl) : "";

  let extraHTML = `<span class="pin-label">${cfg.short}</span>`;
  if (isSelected) {
    extraHTML = `<span class="pin-pulse"></span><span class="pin-glow"></span><span class="pin-label">${cfg.short}</span>`;
  }

  const categoryGlyph = `<span class="pin-glyph" title="${safeCategoryLabel}">${categoryConfig.icon}</span>`;
  const selectedAvatar = isSelected
    ? safeAvatar
      ? `<span class="pin-selected-avatar"><img src="${safeAvatar}" alt="author avatar" /></span>`
      : `<span class="pin-selected-avatar pin-selected-avatar-fallback">👤</span>`
    : "";

  return `<div class="marker-pin ${cfg.pinClass}"><div class="pin-body" style="--pin-category-color:${categoryConfig.color};">${categoryGlyph}${selectedAvatar}</div>${extraHTML}</div>`;
}

export function markerSizeByStatus(status: EventStatus) {
  if (status === "today") {
    return { iconSize: [52, 64] as [number, number], iconAnchor: [26, 64] as [number, number], popupAnchor: [0, -62] as [number, number] };
  }
  if (status === "ended") {
    return { iconSize: [36, 48] as [number, number], iconAnchor: [18, 48] as [number, number], popupAnchor: [0, -46] as [number, number] };
  }
  return { iconSize: [44, 56] as [number, number], iconAnchor: [22, 56] as [number, number], popupAnchor: [0, -54] as [number, number] };
}
