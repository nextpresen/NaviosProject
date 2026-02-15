export type EventStatus = "today" | "upcoming" | "ended";

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

const STATUS_CONFIG = {
  today: { label: "いまココ", emoji: "🔥", className: "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white" },
  upcoming: { label: "開催予定", emoji: "📅", className: "bg-blue-50 text-blue-700" },
  ended: { label: "終了", emoji: "🕐", className: "bg-slate-100 text-slate-500" },
} as const;

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`status-badge text-[10px] font-extrabold tracking-[0.04em] px-2 py-1 rounded-md ${cfg.className} ${className}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}
