import Image from "next/image";
import { getCategoryMeta, getTagLabel } from "@/lib/event-taxonomy";
import type { EventCategory, EventTag } from "@/types/event";
import { StatusBadge, type EventStatus } from "../ui/StatusBadge";
import { EventViewCount } from "./EventViewCount";

interface EventDetailProps {
  id: string;
  title: string;
  content: string;
  category: EventCategory;
  tags: EventTag[];
  imageUrl: string;
  address?: string | null;
  dateText: string;
  daysText: string;
  status: EventStatus;
  viewCount: number;
}

export function EventDetail({
  id,
  title,
  content,
  category,
  tags,
  imageUrl,
  address,
  dateText,
  daysText,
  status,
  viewCount,
}: EventDetailProps) {
  const textColor = status === "today" ? "text-pink-600" : status === "upcoming" ? "text-blue-600" : "text-slate-400";
  const categoryMeta = getCategoryMeta(category);

  return (
    <article data-id={id} className="max-w-3xl mx-auto px-4 py-6">
      <div className="relative rounded-2xl overflow-hidden mb-5">
        <Image
          src={imageUrl}
          alt={title}
          width={1200}
          height={640}
          unoptimized
          className="w-full h-64 object-contain bg-slate-100"
        />
        <StatusBadge status={status} className="absolute top-3 left-3 backdrop-blur-sm shadow" />
        <div className="absolute top-3 right-3 bg-white/85 backdrop-blur-xl rounded-lg px-2.5 py-1 shadow">
          <span className={`text-xs font-bold ${textColor}`}>{daysText}</span>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 mb-3">{title}</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
          <span>{categoryMeta.icon}</span>
          <span>{categoryMeta.label}</span>
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          >
            {getTagLabel(tag)}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-slate-500">
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm font-medium">{dateText}</span>
        </span>
        <EventViewCount eventId={id} initialCount={viewCount} />
      </div>

      {address ? (
        <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <svg className="h-4 w-4 flex-shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="truncate">{address}</span>
        </div>
      ) : null}

      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
    </article>
  );
}
