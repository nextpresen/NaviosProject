export type EventStatus = "today" | "upcoming" | "ended";

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

const STATUS_CONFIG = {
  today: { label: "LIVE NOW", emoji: "🔥", className: "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white" },
  upcoming: { label: "SOON", emoji: "⭐", className: "bg-blue-100/80 text-blue-700" },
  ended: { label: "FINISHED", emoji: "🕐", className: "bg-slate-100 text-slate-500" },
} as const;

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`status-badge text-[10px] font-extrabold tracking-[0.04em] px-2.5 py-1 rounded-full shadow-sm ${cfg.className} ${className}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}
