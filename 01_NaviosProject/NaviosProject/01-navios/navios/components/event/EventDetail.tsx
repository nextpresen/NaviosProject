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
  placeName?: string | null;
  addressLabel?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
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
  placeName,
  addressLabel,
  address,
  latitude,
  longitude,
  dateText,
  daysText,
  status,
  viewCount,
}: EventDetailProps) {
  const textColor = status === "today" ? "text-pink-600" : status === "upcoming" ? "text-blue-600" : "text-slate-400";
  const categoryMeta = getCategoryMeta(category);
  const displayPlaceName = placeName?.trim() || title;
  const displayAddress = addressLabel ?? address;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

  return (
    <article data-id={id} className="bg-white rounded-3xl overflow-hidden shadow-lg">
      {/* Hero Image - 迫力ある全幅表示 */}
      <div className="relative w-full aspect-[21/9] bg-gradient-to-br from-slate-50 to-slate-100">
        <Image
          src={imageUrl}
          alt={title}
          width={1200}
          height={640}
          unoptimized
          className="w-full h-full object-cover"
          priority
        />
        {/* ステータスバッジ - 左上固定 */}
        <div className="absolute top-4 left-4">
          <StatusBadge status={status} className="backdrop-blur-md shadow-lg" />
        </div>
        {/* 日数表示 - 右上固定 */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
          <span className={`text-sm font-bold ${textColor}`}>{daysText}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 lg:p-8">
        {/* タイトルセクション */}
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            {title}
          </h1>

          {/* メタ情報 - 視覚的にグループ化 */}
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            {/* カテゴリ - アイコン強調 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-lg">{categoryMeta.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{categoryMeta.label}</span>
            </div>

            {/* 日時 */}
            <div className="inline-flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="font-medium">{dateText}</span>
            </div>

            {/* 閲覧数 */}
            <EventViewCount eventId={id} initialCount={viewCount} />
          </div>
        </div>

        {/* タグ - 情報補助として控えめに */}
        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
              >
                {getTagLabel(tag)}
              </span>
            ))}
          </div>
        )}

        {/* 住所 - 地図アイコンで視認性向上 */}
        {displayAddress && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-900 mb-0.5">開催場所</p>
                <p className="text-sm font-semibold text-blue-900 leading-relaxed">{displayPlaceName}</p>
                <p className="text-sm text-blue-800 leading-relaxed">{displayAddress}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center rounded-md border border-blue-200 bg-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
                >
                  Googleマップで開く
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 本文 - 読みやすさ重視 */}
        <div className="prose prose-slate max-w-none">
          <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {content}
          </p>
        </div>
      </div>
    </article>
  );
}
