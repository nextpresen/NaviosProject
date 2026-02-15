import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { getEventStatus } from "@/lib/event-status";
import {
  EVENT_CATEGORY_VALUES,
  EVENT_TAG_VALUES,
  type Event,
  type EventFilter,
  type EventTag,
} from "@/types/event";
import { parseTagsJSON, stringifyTagsJSON, toSafeCategory } from "@/lib/event-taxonomy";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import { getUserProfile } from "@/lib/user-profile";

const statusSchema = z.enum(["all", "today", "upcoming", "ended"]);
const querySchema = z.object({
  status: statusSchema.optional(),
  q: z.string().trim().max(120).optional(),
  lat: z.coerce.number().finite().optional(),
  lng: z.coerce.number().finite().optional(),
  radius: z.coerce.number().positive().max(200).optional(),
});

const imageSchema = z
  .string()
  .min(1)
  .max(7_000_000)
  .refine((value) => {
    if (value.startsWith("data:image/")) {
      return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
    }
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Invalid image format");

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

function toEvent(input: {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  author_avatar_url: string | null;
  category: string;
  latitude: number;
  longitude: number;
  start_at: Date | null;
  end_at: Date | null;
  is_all_day: boolean;
  event_date: Date;
  expire_date: Date;
  event_image: string;
  tags_json: string;
}): Event {
  const startAt = input.start_at ?? new Date(`${input.event_date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const endAt = input.end_at ?? new Date(`${input.expire_date.toISOString().slice(0, 10)}T23:59:59.000Z`);
  return {
    id: input.id,
    title: input.title,
    content: input.content,
    author_id: input.author_id,
    author_avatar_url: input.author_avatar_url,
    category: toSafeCategory(input.category),
    latitude: input.latitude,
    longitude: input.longitude,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    is_all_day: input.is_all_day ?? false,
    event_date: input.event_date.toISOString().slice(0, 10),
    expire_date: input.expire_date.toISOString().slice(0, 10),
    event_image: input.event_image,
    tags: parseTagsJSON(input.tags_json),
  };
}

function resolveSchedule(payload: z.infer<typeof eventCreateSchema>) {
  let startAt = payload.start_at ? new Date(payload.start_at) : null;
  let endAt = payload.end_at ? new Date(payload.end_at) : null;

  if (!startAt && payload.event_date) startAt = new Date(`${payload.event_date}T00:00:00.000Z`);
  if (!endAt && payload.expire_date) endAt = new Date(`${payload.expire_date}T23:59:59.000Z`);

  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return null;
  }

  if (payload.is_all_day) {
    const startDate = startAt.toISOString().slice(0, 10);
    const endDate = endAt.toISOString().slice(0, 10);
    startAt = new Date(`${startDate}T00:00:00.000Z`);
    endAt = new Date(`${endDate}T23:59:59.000Z`);
  }

  return { startAt, endAt };
}

function fallbackAvatarFromEmail(email: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(email)}`;
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
    const filtered = filterEvents(events, params);
    return NextResponse.json({ ...ok({ events: filtered }), events: filtered });
  } catch {
    const filtered = filterEvents(MOCK_EVENTS, params);
    return NextResponse.json({ ...ok({ events: filtered }), events: filtered });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = eventCreateSchema.safeParse(body);
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());

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

  if (!actor) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "ログインが必要です"),
      { status: 401 },
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
    return NextResponse.json(
      fail("DB_CREATE_FAILED", "Failed to create event", String(error)),
      { status: 500 },
    );
  }
}
