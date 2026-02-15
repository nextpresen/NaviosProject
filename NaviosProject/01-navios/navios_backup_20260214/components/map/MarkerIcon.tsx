import type { EventStatus } from "../ui/StatusBadge";

const PIN_CONFIG = {
  today: { pinClass: "pin-today", icon: "📍", short: "NOW" },
  upcoming: { pinClass: "pin-upcoming", icon: "📌", short: "SOON" },
  ended: { pinClass: "pin-ended", icon: "📍", short: "END" },
} as const;

export function buildMarkerHTML(status: EventStatus) {
  const cfg = PIN_CONFIG[status];

  let extraHTML = `<span class="pin-label">${cfg.short}</span>`;
  if (status === "today") {
    extraHTML = `<span class="pin-pulse"></span><span class="pin-glow"></span><span class="pin-label">${cfg.short}</span>`;
  }
  if (status === "upcoming") {
    extraHTML = `<span class="pin-pulse"></span><span class="pin-label">${cfg.short}</span>`;
  }

  return `<div class="marker-pin ${cfg.pinClass}"><div class="pin-body"><span class="pin-icon">${cfg.icon}</span></div>${extraHTML}</div>`;
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
