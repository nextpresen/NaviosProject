import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { toEvent } from "@/lib/event-mapper";
import { isArchivedEvent } from "@/lib/event-archive";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";
import type { Event } from "@/types/event";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

function rankPastPopular(events: Event[], limit: number) {
  return events
    .filter((event) => isArchivedEvent(event))
    .sort((a, b) => {
      const scoreDiff = (b.popularity_score ?? 0) - (a.popularity_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.end_at).getTime() - new Date(a.end_at).getTime();
    })
    .slice(0, limit);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid query", parsed.error.flatten()),
      { status: 400 },
    );
  }

  const limit = parsed.data.limit ?? 5;

  try {
    const rows = await prisma.event.findMany({ orderBy: { created_at: "desc" } });
    const events = rows.map(toEvent);
    const popularPastEvents = rankPastPopular(events, limit);
    return NextResponse.json(
      { ...ok({ events: popularPastEvents }), events: popularPastEvents },
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        fail("DB_NOT_READY", "データベースの初期化が必要です（npm run prisma:migrate）。"),
        { status: 503 },
      );
    }
    console.error("GET /api/events/popular-past failed:", error);
    const popularPastEvents = rankPastPopular(MOCK_EVENTS, limit);
    return NextResponse.json(
      { ...ok({ events: popularPastEvents }), events: popularPastEvents },
    );
  }
}

