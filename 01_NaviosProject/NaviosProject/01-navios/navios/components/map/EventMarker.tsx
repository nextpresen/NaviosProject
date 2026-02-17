import type { EventStatus } from "../ui/StatusBadge";

interface EventMarkerProps {
  status: EventStatus;
}

export function EventMarker({ status }: EventMarkerProps) {
  const pinClass = status === "today" ? "pin-today" : status === "upcoming" ? "pin-upcoming" : "pin-ended";
  const icon = status === "upcoming" ? "📌" : "📍";
  const label = status === "today" ? "LIVE NOW" : status === "upcoming" ? "SOON" : "FINISHED";

  return (
    <div className={`marker-pin ${pinClass}`}>
      <div className="pin-body">
        <span className="pin-icon">{icon}</span>
      </div>
      {status === "today" ? <span className="pin-pulse" /> : null}
      {status === "today" ? <span className="pin-glow" /> : null}
      {status === "upcoming" ? <span className="pin-pulse" /> : null}
      <span className="pin-label">{label}</span>
    </div>
  );
}
