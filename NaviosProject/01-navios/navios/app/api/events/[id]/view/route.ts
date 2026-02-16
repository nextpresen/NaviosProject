import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export async function POST(
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

  try {
    const updated = await prisma.event.update({
      where: { id: parsedParams.data.id },
      data: {
        view_count: { increment: 1 },
      },
      select: {
        id: true,
        view_count: true,
      },
    });
    return NextResponse.json(ok({ id: updated.id, view_count: updated.view_count }));
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
    console.error("POST /api/events/[id]/view failed:", error);
    return NextResponse.json(
      fail("DB_UPDATE_FAILED", "閲覧数の更新に失敗しました"),
      { status: 500 },
    );
  }
}

