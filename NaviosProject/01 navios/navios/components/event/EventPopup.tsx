import Image from "next/image";
import Link from "next/link";
import { StatusBadge, type EventStatus } from "../ui/StatusBadge";

interface EventPopupProps {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  dateText: string;
  daysText: string;
  status: EventStatus;
}

export function EventPopup({ id, title, content, imageUrl, dateText, daysText, status }: EventPopupProps) {
  const textColor = status === "today" ? "text-amber-600" : status === "upcoming" ? "text-blue-600" : "text-slate-400";

  return (
    <div className="max-w-full" style={{ width: "min(280px, calc(100vw - 96px))" }}>
      <div className="relative">
        <Image
          src={imageUrl}
          alt={title}
          width={560}
          height={300}
          unoptimized
          className="w-full h-[150px] object-cover"
        />
        <StatusBadge status={status} className="absolute top-[10px] left-[10px]" />
      </div>

      <div className="p-4">
        <p className="mb-1.5 text-[15px] font-bold text-slate-800 line-clamp-2">{title}</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-500">📅 {dateText}</span>
          <span className={`text-[11px] font-bold ${textColor}`}>{daysText}</span>
        </div>
        <p className="mb-3 text-xs text-slate-500 leading-relaxed line-clamp-3">{content}</p>
        <Link
          href={`/event/${id}`}
          className="inline-flex items-center gap-1.5 no-underline bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold px-3.5 py-2 rounded-[10px] border border-slate-300 transition shadow-sm"
        >
          詳細を見る
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
