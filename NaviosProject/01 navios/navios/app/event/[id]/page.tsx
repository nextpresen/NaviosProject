import Link from "next/link";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/event/EventActions";
import { EventDetail } from "@/components/event/EventDetail";
import { daysUntilText, formatDateRange, getEventStatus } from "@/lib/event-status";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import type { Event } from "@/types/event";

function toEvent(input: {
  id: string;
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  event_date: Date;
  expire_date: Date;
  event_image: string;
}): Event {
  return {
    id: input.id,
    title: input.title,
    content: input.content,
    latitude: input.latitude,
    longitude: input.longitude,
    event_date: input.event_date.toISOString().slice(0, 10),
    expire_date: input.expire_date.toISOString().slice(0, 10),
    event_image: input.event_image,
  };
}

async function getEventById(id: string): Promise<Event | null> {
  try {
    const row = await prisma.event.findUnique({ where: { id } });
    if (row) return toEvent(row);
  } catch {
    // DB未接続時はモックへフォールバック
  }

  return MOCK_EVENTS.find((event) => event.id === id) ?? null;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 py-6">
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
        imageUrl={event.event_image}
        dateText={formatDateRange(event.event_date, event.expire_date)}
        daysText={daysUntilText(event)}
        status={getEventStatus(event)}
      />
      <EventActions id={event.id} />
    </main>
  );
}
