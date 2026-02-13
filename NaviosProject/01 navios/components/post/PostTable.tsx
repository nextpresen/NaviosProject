import type { PostItem } from "@/types/post";
import { PostTableRow } from "./PostTableRow";

type Props = {
  posts: PostItem[];
};

export function PostTable({ posts }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">画像</th>
            <th className="px-4 py-3">タイトル</th>
            <th className="px-4 py-3">投稿者</th>
            <th className="px-4 py-3">イベント日</th>
            <th className="px-4 py-3">掲載終了日</th>
            <th className="px-4 py-3">状態</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                投稿がまだありません
              </td>
            </tr>
          ) : (
            posts.map((post) => <PostTableRow key={post.id} post={post} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
