import type { EventStatus } from "../ui/StatusBadge";
import type { EventCategory } from "@/types/event";

const CATEGORY_CONFIG: Record<EventCategory, { icon: string; color: string; label: string }> = {
  festival: { icon: "🎉", color: "#ef4444", label: "祭り" },
  gourmet: { icon: "🍽", color: "#f97316", label: "グルメ" },
  nature: { icon: "🌿", color: "#16a34a", label: "自然" },
  culture: { icon: "🏮", color: "#8b5cf6", label: "文化" },
  other: { icon: "🏷", color: "#64748b", label: "その他" },
};

const PIN_CONFIG = {
  today: { pinClass: "pin-today", short: "LIVE NOW" },
  upcoming: { pinClass: "pin-upcoming", short: "SOON" },
  ended: { pinClass: "pin-ended", short: "END" },
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
  const categoryConfig = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
  const safeCategoryLabel = escapeAttr(categoryConfig.label);
  const safeAvatar = authorAvatarUrl ? escapeAttr(authorAvatarUrl) : "";

  let extraHTML = `<span class="pin-label">${cfg.short}</span>`;
  if (isSelected) {
    extraHTML = `<span class="pin-pulse"></span><span class="pin-glow"></span><span class="pin-label">${cfg.short}</span>`;
  }

  const categoryChip = `<span class="pin-category" style="background:${categoryConfig.color}" title="${safeCategoryLabel}">${categoryConfig.icon}</span>`;
  const avatarHtml = safeAvatar
    ? `<span class="pin-avatar"><img src="${safeAvatar}" alt="author avatar" /></span>`
    : `<span class="pin-avatar pin-avatar-fallback">👤</span>`;

  return `<div class="marker-pin ${cfg.pinClass}"><div class="pin-body">${avatarHtml}${categoryChip}</div>${extraHTML}</div>`;
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
