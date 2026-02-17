import { NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { getUserProfile } from "@/lib/user-profile";

export async function GET(request: Request) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(ok({ actor: null }));
  }
  const profile = await getUserProfile(actor.userId, actor.email);
  return NextResponse.json(ok({ actor: { ...actor, ...profile } }));
}
