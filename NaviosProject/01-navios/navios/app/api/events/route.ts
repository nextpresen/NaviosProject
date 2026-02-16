import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { toEvent } from "@/lib/event-mapper";
import { resolveSchedule } from "@/lib/event-schedule";
import { getEventStatus } from "@/lib/event-status";
import {
  EVENT_CATEGORY_VALUES,
  EVENT_TAG_VALUES,
  type Event,
  type EventFilter,
  type EventTag,
} from "@/types/event";
import { stringifyTagsJSON } from "@/lib/event-taxonomy";
import { imageSchema } from "@/lib/validations/event";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import { getUserProfile } from "@/lib/user-profile";
import { isArchivedEvent } from "@/lib/event-archive";

const statusSchema = z.enum(["all", "today", "upcoming", "ended"]);
const querySchema = z.object({
  status: statusSchema.optional(),
  q: z.string().trim().max(120).optional(),
  lat: z.coerce.number().finite().optional(),
  lng: z.coerce.number().finite().optional(),
  radius: z.coerce.number().positive().max(200).optional(),
});

const eventCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(5000),
  category: z.enum(EVENT_CATEGORY_VALUES).optional(),
  tags: z.array(z.enum(EVENT_TAG_VALUES)).max(3).optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  is_all_day: z.boolean().optional(),
  author_avatar_url: z.string().url().max(2048).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  event_image: imageSchema,
});

function fallbackAvatarFromEmail(email: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(email)}`;
}

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

function filterEvents(
  events: Event[],
  params: {
    status: EventFilter;
    q: string;
    lat?: number;
    lng?: number;
    radius?: number;
  },
) {
  return events.filter((event) => {
    const byStatus = params.status === "all" || params.status === getEventStatus(event);
    const byQuery =
      !params.q ||
      event.title.toLowerCase().includes(params.q) ||
      event.content.toLowerCase().includes(params.q);

    let byDistance = true;
    if (
      params.lat !== undefined &&
      params.lng !== undefined &&
      params.radius !== undefined
    ) {
      const d = haversineKm(
        params.lat,
        params.lng,
        event.latitude,
        event.longitude,
      );
      byDistance = d <= params.radius;
    }

    return byStatus && byQuery && byDistance;
  });
}

function filterActiveFeedEvents(events: Event[]) {
  return events.filter((event) => !isArchivedEvent(event));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    radius: searchParams.get("radius") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid query", parsed.error.flatten()),
      { status: 400 },
    );
  }

  const params = {
    status: (parsed.data.status ?? "all") as EventFilter,
    q: (parsed.data.q ?? "").toLowerCase(),
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    radius: parsed.data.radius,
  };

  try {
    const rows = await prisma.event.findMany({ orderBy: { created_at: "desc" } });
    const events = rows.map(toEvent);
    const activeEvents = filterActiveFeedEvents(events);
    const filtered = filterEvents(activeEvents, params);
    return NextResponse.json({ ...ok({ events: filtered }), events: filtered });
  } catch (error) {
    console.error("GET /api/events failed:", error);
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        fail("SERVICE_UNAVAILABLE", "サービスに一時的な問題が発生しています"),
        { status: 503 },
      );
    }
    const activeEvents = filterActiveFeedEvents(MOCK_EVENTS);
    const filtered = filterEvents(activeEvents, params);
    return NextResponse.json({ ...ok({ events: filtered }), events: filtered });
  }
}

export async function POST(request: Request) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "ログインが必要です"),
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = eventCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", parsed.error.flatten()),
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const schedule = resolveSchedule(payload);
  if (!schedule) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", {
        start_at: ["start_at and end_at are required"],
      }),
      { status: 400 },
    );
  }

  if (schedule.endAt < schedule.startAt) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", {
        end_at: ["end_at must be >= start_at"],
      }),
      { status: 400 },
    );
  }

  try {
    const profile = await getUserProfile(actor.userId, actor.email);
    const created = await prisma.event.create({
      data: {
        title: payload.title,
        content: payload.content,
        author_id: actor.userId,
        author_avatar_url:
          payload.author_avatar_url ?? profile.avatar_url ?? fallbackAvatarFromEmail(actor.email),
        category: payload.category ?? "event",
        latitude: payload.latitude,
        longitude: payload.longitude,
        start_at: schedule.startAt,
        end_at: schedule.endAt,
        is_all_day: payload.is_all_day ?? false,
        event_date: new Date(schedule.startAt.toISOString().slice(0, 10)),
        expire_date: new Date(schedule.endAt.toISOString().slice(0, 10)),
        event_image: payload.event_image,
        tags_json: stringifyTagsJSON(payload.tags as EventTag[] | undefined),
      },
    });

    const event = toEvent(created);
    return NextResponse.json({ ...ok({ event }), event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed:", error);
    if (isMissingTableError(error)) {
      return NextResponse.json(
        fail("DB_NOT_READY", "データベースの初期化が必要です（npm run prisma:migrate）。"),
        { status: 503 },
      );
    }
    return NextResponse.json(
      fail("DB_CREATE_FAILED", "イベントの作成に失敗しました"),
      { status: 500 },
    );
  }
}
