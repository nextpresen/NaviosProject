import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { getUserProfile, saveUserProfile } from "@/lib/user-profile";

const updateSchema = z.object({
  username: z.string().trim().min(1).max(24),
  avatar_url: z
    .string()
    .trim()
    .max(7_000_000)
    .optional()
    .refine((value) => {
      if (!value || value.length === 0) return true;
      if (value.startsWith("data:image/")) {
        return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
      }
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Invalid avatar format"),
});

export async function GET(request: Request) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(fail("UNAUTHORIZED", "ログインが必要です"), { status: 401 });
  }
  const profile = await getUserProfile(actor.userId, actor.email);
  return NextResponse.json(ok({ actor: { ...actor, ...profile } }));
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
    const profile = await saveUserProfile(actor.userId, actor.email, {
      username: parsed.data.username,
      avatar_url: parsed.data.avatar_url,
    });
    return NextResponse.json(ok({ actor: { ...actor, ...profile } }));
  } catch (error) {
    return NextResponse.json(
      fail("DB_UPDATE_FAILED", "プロフィールの更新に失敗しました", String(error)),
      { status: 500 },
    );
  }
}
