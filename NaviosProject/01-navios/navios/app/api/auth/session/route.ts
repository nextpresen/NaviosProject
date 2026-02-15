import { NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { getSessionActorFromRequest, getSessionActorFromServer } from "@/lib/auth-session";
import { getUsername } from "@/lib/user-profile";

export async function GET(request: Request) {
  const actor =
    (await getSessionActorFromRequest(request)) ?? (await getSessionActorFromServer());
  if (!actor) {
    return NextResponse.json(ok({ actor: null }));
  }
  const username = await getUsername(actor.userId, actor.email);
  return NextResponse.json(ok({ actor: { ...actor, username } }));
}
