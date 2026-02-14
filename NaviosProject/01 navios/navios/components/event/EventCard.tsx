"use client";

import Image from "next/image";
import { StatusBadge, type EventStatus } from "../ui/StatusBadge";

export interface EventCardData {
  id: string;
  title: string;
  content: string;
  event_image: string;
  event_date: string;
  expire_date: string;
  status: EventStatus;
  daysText: string;
  dateRangeText: string;
}

interface EventCardProps {
  event: EventCardData;
  active?: boolean;
  onClick?: (id: string) => void;
}

export function EventCard({ event, active = false, onClick }: EventCardProps) {
  const borderAccent =
    event.status === "today"
      ? "border-l-4 border-l-amber-400"
      : event.status === "upcoming"
        ? "border-l-4 border-l-blue-400"
        : "border-l-4 border-l-slate-200";

  const textColor =
    event.status === "today" ? "text-amber-600" : event.status === "upcoming" ? "text-blue-600" : "text-slate-400";

  return (
    <article
      onClick={() => onClick?.(event.id)}
      data-id={event.id}
      className={`post-card bg-white rounded-2xl border border-surface-200 ${borderAccent} overflow-hidden cursor-pointer ${
        event.status === "ended" ? "opacity-60" : ""
      } ${active ? "active" : ""}`}
    >
      <div className="relative">
        <Image
          src={event.event_image}
          alt={event.title}
          width={800}
          height={320}
          unoptimized
          className="w-full h-32 object-cover"
        />
        <StatusBadge status={event.status} className="absolute top-2 left-2 backdrop-blur-sm" />
        <div className="absolute top-2 right-2 bg-white/85 backdrop-blur-xl rounded-lg px-2 py-0.5">
          <span className={`text-[11px] font-bold ${textColor}`}>{event.daysText}</span>
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-bold text-slate-800 mb-1 leading-snug">{event.title}</h3>
        <div className="flex items-center gap-1.5 mb-2 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[11px]">{event.dateRangeText}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{event.content}</p>
      </div>
    </article>
  );
}
