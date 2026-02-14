import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getAuthActor } from "@/lib/authz";
import { getEventStatus } from "@/lib/event-status";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import type { Event, EventFilter } from "@/types/event";

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
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_image: z.string().url().max(2048),
});

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
  const actor = getAuthActor(request);

  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", parsed.error.flatten()),
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (payload.expire_date < payload.event_date) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", {
        expire_date: ["expire_date must be >= event_date"],
      }),
      { status: 400 },
    );
  }

  try {
    const created = await prisma.event.create({
      data: {
        title: payload.title,
        content: payload.content,
        author_id: actor?.userId ?? null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        event_date: new Date(payload.event_date),
        expire_date: new Date(payload.expire_date),
        event_image: payload.event_image,
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
