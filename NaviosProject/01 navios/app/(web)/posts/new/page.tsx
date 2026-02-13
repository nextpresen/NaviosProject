import { PostForm } from "@/components/post/PostForm";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function NewPostPage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <PostForm redirectTo="/" />
      </div>
    </AuthGuard>
  );
}
