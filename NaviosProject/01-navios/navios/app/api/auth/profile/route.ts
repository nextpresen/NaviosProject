import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { getUsername, saveUsername } from "@/lib/user-profile";

const updateSchema = z.object({
  username: z.string().trim().min(1).max(24),
});

export async function GET(request: Request) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(fail("UNAUTHORIZED", "ログインが必要です"), { status: 401 });
  }
  const username = await getUsername(actor.userId, actor.email);
  return NextResponse.json(ok({ actor: { ...actor, username } }));
}

export async function PATCH(request: Request) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(fail("UNAUTHORIZED", "ログインが必要です"), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid payload", parsed.error.flatten()),
      { status: 400 },
    );
  }

  try {
    const username = await saveUsername(actor.userId, actor.email, parsed.data.username);
    return NextResponse.json(ok({ actor: { ...actor, username } }));
  } catch (error) {
    return NextResponse.json(
      fail("DB_UPDATE_FAILED", "ユーザー名の更新に失敗しました", String(error)),
      { status: 500 },
    );
  }
}
