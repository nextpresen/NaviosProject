"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type Actor = {
  userId: string;
  role: "user" | "admin";
  email: string;
};

interface MenuDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function MenuDrawer({
  isOpen,
  onClose,
}: MenuDrawerProps) {
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
    await signOut({ redirect: false });
    await fetch("/api/auth/logout", { method: "POST" });
    setActor(null);
    onClose?.();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <div className={`menu-overlay fixed inset-0 z-[3000] bg-black/40 transition-opacity ${isOpen ? "open opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

      <div className={`menu-drawer fixed top-0 right-0 bottom-0 z-[3001] w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform ${isOpen ? "open translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
              <Image src="/navios-logo.svg" alt="Navios logo" width={24} height={24} className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-base">Navios</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 transition">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-t border-surface-100 mx-4" />
        <div className="p-4">
          {loading ? null : actor ? (
            <div className="space-y-1">
              <Link
                href="/new"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-50 transition"
              >
                <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <span className="text-sm font-semibold">投稿する</span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-50 transition"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h8v16H3z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold">ログアウト</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                href="/signup"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-50 transition"
              >
                <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <span className="text-sm font-semibold">新規登録</span>
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-50 transition"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-sm font-semibold">ログイン</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
