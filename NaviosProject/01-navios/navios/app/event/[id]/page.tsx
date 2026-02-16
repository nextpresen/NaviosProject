import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/event/EventActions";
import { getSessionActorFromServer } from "@/lib/auth-session";
import { canManageEvent } from "@/lib/authz";
import { toEvent } from "@/lib/event-mapper";
import { getCategoryMeta } from "@/lib/event-taxonomy";
import { EventDetail } from "@/components/event/EventDetail";
import { daysUntilText, formatEventSchedule, getEventStatus } from "@/lib/event-status";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import type { Event } from "@/types/event";

async function getEventById(id: string): Promise<Event | null> {
  try {
    const row = await prisma.event.findUnique({ where: { id } });
    if (row) return toEvent(row);
  } catch (error) {
    console.error("getEventById failed:", error);
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    // DB未接続時はモックへフォールバック
  }

  return MOCK_EVENTS.find((event) => event.id === id) ?? null;
}

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).toString();
  } catch {
    return "http://localhost:3000";
  }
}

function toAbsoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return new URL(pathOrUrl, getSiteUrl()).toString();
}

function eventDescription(event: Event) {
  const categoryLabel = getCategoryMeta(event.category).label;
  const summary = `${categoryLabel} / ${formatEventSchedule(event)} / ${event.content}`.replaceAll(/\s+/g, " ").trim();
  return summary.length > 120 ? `${summary.slice(0, 120)}...` : summary;
}

function buildEventJsonLd(event: Event) {
  const status = getEventStatus(event);
  const eventStatus =
    status === "ended"
      ? "https://schema.org/EventCompleted"
      : "https://schema.org/EventScheduled";
  const image =
    event.event_image.startsWith("http://") || event.event_image.startsWith("https://")
      ? event.event_image
      : "/navios-logo.svg";
  const startDate = event.start_at ?? `${event.event_date}T09:00:00+09:00`;
  const endDate = event.end_at ?? `${event.expire_date}T23:59:59+09:00`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: eventDescription(event),
    eventStatus,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    startDate,
    endDate,
    image: [toAbsoluteUrl(image)],
    url: toAbsoluteUrl(`/event/${event.id}`),
    location: {
      "@type": "Place",
      name: "日置市周辺",
      geo: {
        "@type": "GeoCoordinates",
        latitude: event.latitude,
        longitude: event.longitude,
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Navios",
      url: getSiteUrl(),
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return {
      title: "イベントが見つかりません",
      description: "地域イベント情報の詳細ページです。",
    };
  }

  const title = `${event.title} | Navios`;
  const description = eventDescription(event);
  const image = event.event_image.startsWith("http://") || event.event_image.startsWith("https://")
    ? event.event_image
    : "/navios-logo.svg";
  const imageUrl = toAbsoluteUrl(image);
  const url = `/event/${event.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      locale: "ja_JP",
      siteName: "Navios",
      images: [
        {
          url: imageUrl,
          alt: `${event.title} のイベント画像`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  const actor = await getSessionActorFromServer();

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildEventJsonLd(event)),
        }}
      />
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← マップへ戻る
        </Link>
      </div>
      <EventDetail
        id={event.id}
        title={event.title}
        content={event.content}
        category={event.category}
        tags={event.tags}
        imageUrl={event.event_image}
        address={event.address}
        dateText={formatEventSchedule(event)}
        daysText={daysUntilText(event)}
        status={getEventStatus(event)}
        viewCount={event.view_count ?? 0}
      />
      <EventActions
        id={event.id}
        canManage={Boolean(actor && canManageEvent(actor, event.author_id ?? null))}
      />
    </main>
  );
}
