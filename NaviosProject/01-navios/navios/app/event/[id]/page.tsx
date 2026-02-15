import Link from "next/link";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/event/EventActions";
import { getSessionActorFromServer } from "@/lib/auth-session";
import { canManageEvent } from "@/lib/authz";
import { toEvent } from "@/lib/event-mapper";
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
        dateText={formatEventSchedule(event)}
        daysText={daysUntilText(event)}
        status={getEventStatus(event)}
      />
      <EventActions
        id={event.id}
        canManage={Boolean(actor && canManageEvent(actor, event.author_id ?? null))}
      />
    </main>
  );
}
