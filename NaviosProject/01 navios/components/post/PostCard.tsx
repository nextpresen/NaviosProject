import Link from "next/link";
import type { PostItem } from "@/types/post";
import { Card } from "@/components/ui";

type Props = {
  post: PostItem;
};

export function PostCard({ post }: Props) {
  return (
    <Link href={`/events/${post.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-slate-100">
            <svg
              className="h-12 w-12 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="p-4">
          <h3 className="mb-1 text-lg font-semibold text-slate-900 line-clamp-1">
            {post.title}
          </h3>
          <p className="mb-3 text-sm text-slate-600 line-clamp-2">
            {post.content}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{post.author_name}</span>
            <span>{post.event_date}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
