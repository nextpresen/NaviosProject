"use client";

import { useCallback, useEffect, useState } from "react";
import { PostForm } from "@/components/PostForm";
import { PostTable } from "@/components/PostTable";
import type { PostItem } from "@/types/post";

export default function HomePage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/posts", { cache: "no-store" });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? "投稿の取得に失敗しました");
    }

    const data = (await res.json()) as PostItem[];
    setPosts(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadPosts();
      } catch (err) {
        setError(err instanceof Error ? err.message : "不明なエラーです");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPosts]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-4 md:p-8">
      <header className="rounded-xl bg-brand-900 p-6 text-white shadow-sm">
        <p className="text-sm uppercase tracking-wider text-brand-100">NaviOs</p>
        <h1 className="text-2xl font-bold md:text-3xl">投稿管理画面 (MVP)</h1>
        <p className="mt-2 text-sm text-brand-100">
          生活情報を投稿・管理するための最小構成です。
        </p>
      </header>

      <PostForm onCreated={loadPosts} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">投稿一覧</h2>
        {loading ? <p className="text-slate-600">読み込み中...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
        {!loading && !error ? <PostTable posts={posts} /> : null}
      </section>
    </main>
  );
}
