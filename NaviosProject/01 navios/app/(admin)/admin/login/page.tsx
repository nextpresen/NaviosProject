import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
          管理者ログイン
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          NaviOs 管理画面にアクセスするにはログインしてください
        </p>
        <LoginForm redirectTo="/admin" />
      </Card>
    </div>
  );
}
