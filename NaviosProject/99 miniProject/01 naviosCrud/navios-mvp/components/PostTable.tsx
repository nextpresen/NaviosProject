import type { PostItem } from "@/types/post";

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
            <th className="px-4 py-3">緯度経度</th>
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
            posts.map((post) => (
              <tr key={post.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-14 w-14 rounded object-cover"
                    />
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{post.title}</td>
                <td className="px-4 py-3">{post.author_name}</td>
                <td className="px-4 py-3">{post.event_date}</td>
                <td className="px-4 py-3">{post.expire_date}</td>
                <td className="px-4 py-3">{post.status}</td>
                <td className="px-4 py-3">
                  {post.latitude}, {post.longitude}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
