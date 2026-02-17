"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "新規登録に失敗しました");
      }

      const signed = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signed || signed.error) {
        throw new Error("登録後のログインに失敗しました。ログイン画面からお試しください。");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新規登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-100 p-4 md:p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-7">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">新規ユーザー登録</h1>
        <p className="text-sm text-slate-500 mb-6">アカウント作成後すぐに投稿を開始できます。</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">メールアドレス</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">パスワード</span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">表示名（任意）</span>
            <input
              maxLength={24}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="例: takuya"
            />
          </label>

          {error ? <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-60"
          >
            {submitting ? "登録中..." : "新規登録"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="font-semibold text-slate-900 underline underline-offset-2">
            ログインへ
          </Link>
        </p>
      </div>
    </main>
  );
}
