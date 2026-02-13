import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { PostInput, PostStatus } from "@/types/post";

const allowedStatus: PostStatus[] = ["draft", "published", "expired"];

const isValidPostInput = (input: unknown): input is PostInput => {
  if (!input || typeof input !== "object") return false;

  const body = input as Record<string, unknown>;
  return (
    typeof body.title === "string" &&
    typeof body.content === "string" &&
    (typeof body.image_url === "string" ||
      body.image_url === null ||
      typeof body.image_url === "undefined") &&
    typeof body.latitude === "number" &&
    typeof body.longitude === "number" &&
    typeof body.event_date === "string" &&
    typeof body.author_name === "string" &&
    typeof body.expire_date === "string" &&
    typeof body.status === "string" &&
    allowedStatus.includes(body.status as PostStatus)
  );
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const json = await req.json();

  if (!isValidPostInput(json)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert(json)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
