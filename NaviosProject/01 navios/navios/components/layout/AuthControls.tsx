"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Actor = {
  userId: string;
  role: "user" | "admin";
  email: string;
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

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/new"
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-brand-600/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        新規投稿
      </Link>

      {loading ? null : actor ? (
        <>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold rounded-lg border border-slate-300 px-2.5 py-1.5"
          >
            ログアウト
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold cursor-default">
            {actor.role === "admin" ? "A" : "U"}
          </div>
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
