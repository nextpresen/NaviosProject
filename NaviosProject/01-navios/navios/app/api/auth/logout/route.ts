import { NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { buildSessionClearCookie } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json(ok({ success: true }));
  response.headers.set("Set-Cookie", buildSessionClearCookie());
  return response;
}
