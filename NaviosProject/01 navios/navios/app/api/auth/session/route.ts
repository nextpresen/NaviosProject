import { NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { getSessionActorFromRequest } from "@/lib/auth-session";

export async function GET(request: Request) {
  const actor = getSessionActorFromRequest(request);
  return NextResponse.json(ok({ actor }));
}
