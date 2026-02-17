import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { authenticate, buildSessionSetCookie, createSessionToken } from "@/lib/auth-session";
import { getUserProfile } from "@/lib/user-profile";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid login payload", parsed.error.flatten()),
      { status: 400 },
    );
  }

  const actor = authenticate(parsed.data.email, parsed.data.password);
  if (!actor) {
    return NextResponse.json(
      fail("UNAUTHORIZED", "メールアドレスまたはパスワードが正しくありません"),
      { status: 401 },
    );
  }

  const profile = await getUserProfile(actor.userId, actor.email);
  const token = createSessionToken(actor);
  const response = NextResponse.json(ok({ actor: { ...actor, ...profile } }));
  response.headers.set("Set-Cookie", buildSessionSetCookie(token));
  return response;
}
