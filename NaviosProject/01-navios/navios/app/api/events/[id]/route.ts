import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { canManageEvent } from "@/lib/authz";
import {
  EVENT_CATEGORY_VALUES,
  EVENT_TAG_VALUES,
  type Event,
  type EventTag,
} from "@/types/event";
import { parseTagsJSON, stringifyTagsJSON, toSafeCategory } from "@/lib/event-taxonomy";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
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

const eventUpdateSchema = z.object({
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

function resolveSchedule(payload: z.infer<typeof eventUpdateSchema>) {
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

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid path parameter", parsedParams.error.flatten()),
      { status: 400 },
    );
  }

  const { id } = parsedParams.data;

  try {
    const row = await prisma.event.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    const event = toEvent(row);
    return NextResponse.json({ ...ok({ event }), event });
  } catch {
    const event = MOCK_EVENTS.find((item) => item.id === id);
    if (!event) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    return NextResponse.json({ ...ok({ event }), event });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "ログインが必要です"),
      { status: 401 },
    );
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid path parameter", parsedParams.error.flatten()),
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsedBody = eventUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", parsedBody.error.flatten()),
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
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
    const existing = await prisma.event.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, author_id: true },
    });
    if (!existing) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    if (!canManageEvent(actor, existing.author_id)) {
      return NextResponse.json(
        fail("FORBIDDEN", "この投稿を編集する権限がありません"),
        { status: 403 },
      );
    }

    const updated = await prisma.event.update({
      where: { id: parsedParams.data.id },
      data: {
        title: payload.title,
        content: payload.content,
        category: payload.category,
        tags_json: stringifyTagsJSON(payload.tags as EventTag[] | undefined),
        author_avatar_url: payload.author_avatar_url,
        latitude: payload.latitude,
        longitude: payload.longitude,
        start_at: schedule.startAt,
        end_at: schedule.endAt,
        is_all_day: payload.is_all_day ?? false,
        event_date: new Date(schedule.startAt.toISOString().slice(0, 10)),
        expire_date: new Date(schedule.endAt.toISOString().slice(0, 10)),
        event_image: payload.event_image,
      },
    });

    const event = toEvent(updated);
    return NextResponse.json({ ...ok({ event }), event });
  } catch (error) {
    const message = String(error);
    if (message.includes("Record to update not found")) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    return NextResponse.json(
      fail("DB_UPDATE_FAILED", "Failed to update event", message),
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "ログインが必要です"),
      { status: 401 },
    );
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid path parameter", parsedParams.error.flatten()),
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.event.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, author_id: true },
    });
    if (!existing) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    if (!canManageEvent(actor, existing.author_id)) {
      return NextResponse.json(
        fail("FORBIDDEN", "この投稿を削除する権限がありません"),
        { status: 403 },
      );
    }

    await prisma.event.delete({ where: { id: parsedParams.data.id } });
    return NextResponse.json(ok({ id: parsedParams.data.id }));
  } catch (error) {
    const message = String(error);
    if (message.includes("Record to delete does not exist")) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    return NextResponse.json(
      fail("DB_DELETE_FAILED", "Failed to delete event", message),
      { status: 500 },
    );
  }
}
