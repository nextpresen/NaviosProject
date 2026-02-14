import { StatusBadge, type EventStatus } from "../ui/StatusBadge";

interface EventDetailProps {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  dateText: string;
  daysText: string;
  status: EventStatus;
}

export function EventDetail({ id, title, content, imageUrl, dateText, daysText, status }: EventDetailProps) {
  const textColor = status === "today" ? "text-amber-600" : status === "upcoming" ? "text-blue-600" : "text-slate-400";

  return (
    <article data-id={id} className="max-w-3xl mx-auto px-4 py-6">
      <div className="relative rounded-2xl overflow-hidden mb-5">
        <img src={imageUrl} alt={title} className="w-full h-64 object-cover" />
        <StatusBadge status={status} className="absolute top-3 left-3 backdrop-blur-sm shadow" />
        <div className="absolute top-3 right-3 bg-white/85 backdrop-blur-xl rounded-lg px-2.5 py-1 shadow">
          <span className={`text-xs font-bold ${textColor}`}>{daysText}</span>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 mb-3">{title}</h1>

      <div className="flex items-center gap-2 mb-4 text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-sm font-medium">{dateText}</span>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
    </article>
  );
}
