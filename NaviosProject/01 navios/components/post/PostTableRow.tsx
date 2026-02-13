"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostItem } from "@/types/post";
import { PostStatusBadge } from "./PostStatusBadge";
import { Button } from "@/components/ui";

type Props = {
  post: PostItem;
};

export function PostTableRow({ post }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`「${post.title}」を削除しますか？`)) return;

    setDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });

    if (res.ok) {
      router.refresh();
    } else {
      alert("削除に失敗しました");
    }
    setDeleting(false);
  };

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-slate-400">
            -
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/events/${post.id}`}
          className="font-medium text-brand-700 hover:underline"
          target="_blank"
        >
          {post.title}
        </Link>
      </td>
      <td className="px-4 py-3">{post.author_name}</td>
      <td className="px-4 py-3">{post.event_date}</td>
      <td className="px-4 py-3">{post.expire_date}</td>
      <td className="px-4 py-3">
        <PostStatusBadge status={post.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Link href={`/admin/posts/${post.id}/edit`}>
            <Button variant="secondary" size="sm">
              編集
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
          >
            削除
          </Button>
        </div>
      </td>
    </tr>
  );
}
