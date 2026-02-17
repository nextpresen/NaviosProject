import Image from "next/image";
import Link from "next/link";
import { StatusBadge, type EventStatus } from "../ui/StatusBadge";

interface EventPopupProps {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  placeName?: string | null;
  addressLabel?: string | null;
  latitude: number;
  longitude: number;
  dateText: string;
  daysText: string;
  status: EventStatus;
}

export function EventPopup({
  id,
  title,
  content,
  imageUrl,
  placeName,
  addressLabel,
  latitude,
  longitude,
  dateText,
  daysText,
  status,
}: EventPopupProps) {
  const textColor = status === "today" ? "text-pink-600" : status === "upcoming" ? "text-blue-600" : "text-slate-400";
  const locationTitle = placeName?.trim() || title;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ width: "min(350px, calc(100vw - 24px))", minHeight: "96px" }}>
      <div className="flex h-full">
        <div className="relative w-[92px] flex-shrink-0 bg-slate-100">
          <Image
            src={imageUrl}
            alt={title}
            width={184}
            height={192}
            unoptimized
            className="h-full w-full object-contain"
          />
          <StatusBadge status={status} className="absolute top-1.5 left-1.5 scale-[0.82] origin-top-left" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-slate-800">{title}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-700">📍 {locationTitle}</p>
            {addressLabel ? <p className="mt-0.5 truncate text-[10px] text-slate-500">{addressLabel}</p> : null}
            <p className="mt-0.5 truncate text-[11px] text-slate-500">📅 {dateText}</p>
            <p className={`mt-0.5 text-[10px] font-bold ${textColor}`}>{daysText}</p>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <p className="line-clamp-1 text-[10px] text-slate-500">{content}</p>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <Link
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
              >
                Googleで開く
              </Link>
              <Link
                href={`/event/${id}`}
                className="inline-flex items-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-900 hover:bg-slate-50"
              >
                詳細
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
