"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { PostTable } from "@/components/post/PostTable";
import { Spinner, Button } from "@/components/ui";
import type { PostItem } from "@/types/post";

export default function AdminUserPostsPage() {
  const params = useParams();
  const userId = params.id as string;
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch(`/api/users/${userId}/posts`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [userId]);

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="secondary" size="sm">
              &larr; ユーザー一覧
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            ユーザーの投稿一覧
          </h1>
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
