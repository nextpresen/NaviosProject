import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: { id: string };
};

export async function GET(_req: Request, context: RouteContext) {
  const { id } = context.params;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
