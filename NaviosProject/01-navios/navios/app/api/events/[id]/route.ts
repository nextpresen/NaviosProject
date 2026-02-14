import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest } from "@/lib/auth-session";
import { canManageEvent } from "@/lib/authz";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import type { Event, EventCategory } from "@/types/event";

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
  category: z.enum(["festival", "gourmet", "nature", "culture", "other"]).optional(),
  author_avatar_url: z.string().url().max(2048).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  event_date: Date;
  expire_date: Date;
  event_image: string;
}): Event {
  return {
    id: input.id,
    title: input.title,
    content: input.content,
    author_id: input.author_id,
    author_avatar_url: input.author_avatar_url,
    category: (input.category as EventCategory) ?? "other",
    latitude: input.latitude,
    longitude: input.longitude,
    event_date: input.event_date.toISOString().slice(0, 10),
    expire_date: input.expire_date.toISOString().slice(0, 10),
    event_image: input.event_image,
  };
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
  const actor = getSessionActorFromRequest(request);
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
  if (payload.expire_date < payload.event_date) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", {
        expire_date: ["expire_date must be >= event_date"],
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
        author_avatar_url: payload.author_avatar_url,
        latitude: payload.latitude,
        longitude: payload.longitude,
        event_date: new Date(payload.event_date),
        expire_date: new Date(payload.expire_date),
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
  const actor = getSessionActorFromRequest(request);
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
