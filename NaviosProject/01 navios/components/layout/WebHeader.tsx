"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui";
import { SearchBox } from "@/components/search/SearchBox";

export function WebHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold text-brand-700"
        >
          {APP_NAME}
        </Link>

        <div className="hidden flex-1 md:block">
          <Suspense fallback={null}>
            <SearchBox />
          </Suspense>
        </div>

        <nav className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link href="/posts/new">
                <Button size="sm">投稿する</Button>
              </Link>
              <button
                onClick={signOut}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">
                ログイン
              </Button>
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile search */}
      <div className="border-t border-slate-100 px-4 py-2 md:hidden">
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
