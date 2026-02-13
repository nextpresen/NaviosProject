import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "post-images";
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const formData = await req.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "画像ファイルがありません" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "画像形式のみアップロードできます" }, { status: 400 });
  }

  if (image.size > MAX_SIZE) {
    return NextResponse.json({ error: "画像サイズは5MB以下にしてください" }, { status: 400 });
  }

  const ext = image.name.includes(".") ? image.name.split(".").pop() : "jpg";
  const filePath = `posts/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, image, {
      contentType: image.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
