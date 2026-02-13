"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/posts/new", label: "新規投稿" },
  { href: "/admin/users", label: "ユーザー管理" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <Link href="/admin" className="text-lg font-bold text-brand-700">
          {APP_NAME}
        </Link>
        <p className="text-xs text-slate-500">管理画面</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">
        <button
          onClick={signOut}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}
