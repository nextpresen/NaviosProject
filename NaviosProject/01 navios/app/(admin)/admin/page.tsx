"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PostItem } from "@/types/post";
import { PostTable } from "@/components/post/PostTable";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Button, Spinner } from "@/components/ui";

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    const res = await fetch("/api/posts?all=true", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">投稿管理</h1>
          <Link href="/admin/posts/new">
            <Button>新規投稿</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <PostTable posts={posts} />
        )}
      </div>
    </AdminGuard>
  );
}
