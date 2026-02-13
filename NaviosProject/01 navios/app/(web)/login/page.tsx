import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          ログイン
        </h1>
        <LoginForm redirectTo="/" />
      </Card>
    </div>
  );
}
