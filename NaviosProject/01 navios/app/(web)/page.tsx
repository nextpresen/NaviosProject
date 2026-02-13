import type { PostItem } from "@/types/post";
import { PostCard } from "@/components/post/PostCard";
import { MapPlaceholder } from "@/components/map/MapPlaceholder";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string };
};

async function getPosts(q?: string): Promise<PostItem[]> {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");

  let query = supabaseAdmin
    .from("posts")
    .select("*")
    .eq("status", "published")
    .gte("expire_date", new Date().toISOString().split("T")[0])
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Posts fetch error:", error.message);
    return [];
  }

  return (data ?? []) as PostItem[];
}

export default async function HomePage({ searchParams }: Props) {
  const q = searchParams.q;
  const posts = await getPosts(q);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <MapPlaceholder />

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          {q ? `「${q}」の検索結果` : "イベント一覧"}
        </h2>

        {(posts ?? []).length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {q ? "該当するイベントが見つかりません" : "現在公開中のイベントはありません"}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(posts as PostItem[]).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
