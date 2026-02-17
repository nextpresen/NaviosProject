"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Actor = {
  userId: string;
  role: "user" | "admin";
  email: string;
  username?: string;
  avatar_url?: string;
};

export default function MePage() {
  const router = useRouter();
  const [actor, setActor] = useState<Actor | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/auth/profile", { cache: "no-store" });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | { data?: { actor?: Actor | null } }
          | null;
        const nextActor = payload?.data?.actor ?? null;
        if (!cancelled) {
          setActor(nextActor);
          setUsername(nextActor?.username ?? "");
          setAvatarUrl(nextActor?.avatar_url ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("アイコン画像は2MB以下にしてください。");
      return;
    }
    setError(null);
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setError("画像の読み込みに失敗しました。");
      } else {
        setAvatarUrl(result);
      }
      setReadingImage(false);
    };
    reader.onerror = () => {
      setError("画像の読み込みに失敗しました。");
      setReadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar_url: avatarUrl }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: { actor?: Actor | null };
            error?: { code?: string; message?: string };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "ユーザー名の更新に失敗しました");
      }
      const nextActor = payload?.data?.actor ?? null;
      setActor(nextActor);
      setUsername(nextActor?.username ?? username);
      setAvatarUrl(nextActor?.avatar_url ?? avatarUrl);
      setMessage("プロフィールを更新しました。");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロフィールの更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-slate-100 p-4 md:p-8">
        <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!actor) {
    return null;
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 p-4 md:p-8">
      <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">ログインユーザー</h1>
        <p className="mt-1 text-sm text-slate-500">ユーザー名とアイコン画像を編集できます。</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white"
              />
            ) : (
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a4 4 0 00-8 0" />
                  <circle cx="11" cy="8" r="3" />
                </svg>
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-500">現在の表示名</p>
              <p className="text-xl font-extrabold text-slate-900">{actor.username ?? actor.userId}</p>
              <p className="mt-1 text-sm text-slate-500">{actor.email}</p>
            </div>
          </div>
        </div>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">ユーザー名</span>
            <input
              required
              minLength={1}
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">アイコン画像</span>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <p className="mt-1.5 text-xs text-slate-500">2MBまで。保存すると投稿ピンに反映されます。</p>
          </label>

          {message ? (
            <p className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{message}</p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || readingImage}
              className="inline-flex items-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "保存中..." : readingImage ? "画像処理中..." : "プロフィールを保存"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              トップへ戻る
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
