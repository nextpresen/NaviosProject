import type { PostItem } from "@/types/post";
import { PostStatusBadge } from "./PostStatusBadge";

type Props = {
  post: PostItem;
};

export function PostDetail({ post }: Props) {
  return (
    <article className="space-y-6">
      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.title}
          className="h-80 w-full rounded-xl object-cover"
        />
      )}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <PostStatusBadge status={post.status} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
        <div>
          <span className="font-medium">投稿者:</span> {post.author_name}
        </div>
        <div>
          <span className="font-medium">イベント日:</span> {post.event_date}
        </div>
        <div>
          <span className="font-medium">掲載終了日:</span> {post.expire_date}
        </div>
        <div>
          <span className="font-medium">位置:</span> {post.latitude},{" "}
          {post.longitude}
        </div>
      </div>

      <div className="prose max-w-none whitespace-pre-wrap text-slate-800">
        {post.content}
      </div>
    </article>
  );
}
