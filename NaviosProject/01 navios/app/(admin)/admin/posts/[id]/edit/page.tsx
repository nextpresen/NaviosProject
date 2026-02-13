"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostForm } from "@/components/post/PostForm";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Spinner } from "@/components/ui";
import type { PostItem } from "@/types/post";

export default function AdminEditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        setError("投稿の取得に失敗しました");
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  return (
    <AdminGuard>
      <div className="mx-auto max-w-2xl">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {post && (
          <PostForm
            mode="edit"
            showStatusField
            postId={id}
            initialData={post}
            redirectTo="/admin"
          />
        )}
      </div>
    </AdminGuard>
  );
}
