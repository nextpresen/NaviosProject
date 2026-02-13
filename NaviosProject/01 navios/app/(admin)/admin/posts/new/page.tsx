import { PostForm } from "@/components/post/PostForm";
import { AdminGuard } from "@/components/auth/AdminGuard";

export default function AdminNewPostPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-2xl">
        <PostForm showStatusField redirectTo="/admin" />
      </div>
    </AdminGuard>
  );
}
