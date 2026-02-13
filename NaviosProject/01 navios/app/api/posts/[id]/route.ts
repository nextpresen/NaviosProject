import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PostStatus } from "@/types/post";

const allowedStatus: PostStatus[] = ["draft", "published", "expired"];

type RouteContext = {
  params: { id: string };
};

export async function GET(_req: Request, context: RouteContext) {
  const { id } = context.params;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function PUT(req: Request, context: RouteContext) {
  const { id } = context.params;
  const json = await req.json();

  if (json.status && !allowedStatus.includes(json.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(json)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = context.params;

  const { error } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
