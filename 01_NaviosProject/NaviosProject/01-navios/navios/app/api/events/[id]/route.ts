import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { canManageEvent } from "@/lib/authz";
import { toEvent } from "@/lib/event-mapper";
import { resolveSchedule } from "@/lib/event-schedule";
import {
  EVENT_CATEGORY_VALUES,
  EVENT_TAG_VALUES,
  type EventTag,
} from "@/types/event";
import { stringifyTagsJSON } from "@/lib/event-taxonomy";
import { imageSchema } from "@/lib/validations/event";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import { reverseGeocodeAddress } from "@/lib/reverse-geocode";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

const eventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(5000),
  place_name: z.string().trim().min(1).max(160).optional(),
  address_label: z.string().trim().min(1).max(255).optional(),
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
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        fail("DB_NOT_READY", "データベースの初期化が必要です（npm run prisma:migrate）。"),
        { status: 503 },
      );
    }
    console.error("GET /api/events/[id] failed:", error);
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        fail("SERVICE_UNAVAILABLE", "サービスに一時的な問題が発生しています"),
        { status: 503 },
      );
    }
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
      select: {
        id: true,
        author_id: true,
        latitude: true,
        longitude: true,
        place_name: true,
        address_label: true,
        address: true,
      },
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

    const coordinatesChanged =
      Math.abs(existing.latitude - payload.latitude) > 0.000001 ||
      Math.abs(existing.longitude - payload.longitude) > 0.000001;
    const geocodedAddress = coordinatesChanged
      ? await reverseGeocodeAddress(payload.latitude, payload.longitude)
      : existing.address_label ?? existing.address;
    const nextPlaceName = payload.place_name ?? existing.place_name ?? payload.title;
    const nextAddressLabel = payload.address_label ?? geocodedAddress;

    const updated = await prisma.event.update({
      where: { id: parsedParams.data.id },
      data: {
        title: payload.title,
        content: payload.content,
        place_name: nextPlaceName,
        address_label: nextAddressLabel,
        category: payload.category,
        tags_json: stringifyTagsJSON(payload.tags as EventTag[] | undefined),
        author_avatar_url: payload.author_avatar_url,
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: nextAddressLabel,
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
    if (isMissingTableError(error)) {
      return NextResponse.json(
        fail("DB_NOT_READY", "データベースの初期化が必要です（npm run prisma:migrate）。"),
        { status: 503 },
      );
    }
    const message = String(error);
    if (message.includes("Record to update not found")) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    console.error("PUT /api/events/[id] failed:", error);
    return NextResponse.json(
      fail("DB_UPDATE_FAILED", "イベントの更新に失敗しました"),
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
    if (isMissingTableError(error)) {
      return NextResponse.json(
        fail("DB_NOT_READY", "データベースの初期化が必要です（npm run prisma:migrate）。"),
        { status: 503 },
      );
    }
    const message = String(error);
    if (message.includes("Record to delete does not exist")) {
      return NextResponse.json(fail("NOT_FOUND", "Event not found"), { status: 404 });
    }
    console.error("DELETE /api/events/[id] failed:", error);
    return NextResponse.json(
      fail("DB_DELETE_FAILED", "イベントの削除に失敗しました"),
      { status: 500 },
    );
  }
}
