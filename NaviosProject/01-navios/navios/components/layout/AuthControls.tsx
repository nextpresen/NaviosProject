"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Actor = {
  userId: string;
  role: "user" | "admin";
  email: string;
  username?: string;
};

export function AuthControls() {
  const router = useRouter();
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { data?: { actor?: Actor | null } }
          | null;
        if (!cancelled) {
          setActor(payload?.data?.actor ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setActor(null);
    router.push("/");
    router.refresh();
  };

  const displayName = actor
    ? (actor.username ?? actor.email.split("@")[0] ?? actor.userId)
    : "";

  return (
    <div className="flex items-center gap-2">
      {loading ? null : actor ? (
        <>
          <Link
            href="/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            投稿する
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold rounded-lg border border-slate-300 px-2.5 py-1.5"
          >
            ログアウト
          </button>
          <Link
            href="/me"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 hover:bg-slate-50 transition"
          >
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a4 4 0 00-8 0" />
                <circle cx="11" cy="8" r="3" />
              </svg>
            </span>
            <span className="max-w-[120px] truncate text-xs font-semibold text-slate-700">
              {displayName}
            </span>
          </Link>
        </>
      ) : (
        <Link
          href="/login"
          className="text-xs font-semibold rounded-lg border border-slate-300 px-2.5 py-1.5"
        >
          ログイン
        </Link>
      )}
    </div>
  );
}
