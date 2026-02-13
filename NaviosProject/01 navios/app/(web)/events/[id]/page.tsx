import Link from "next/link";
import { notFound } from "next/navigation";
import type { PostItem } from "@/types/post";
import { PostDetail } from "@/components/post/PostDetail";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = params;

  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-brand-700 hover:underline"
      >
        &larr; イベント一覧に戻る
      </Link>

      <Card className="p-6">
        <PostDetail post={post as PostItem} />
      </Card>
    </div>
  );
}
