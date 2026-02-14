"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FilterType } from "../ui/FilterTabs";

type Actor = {
  userId: string;
  role: "user" | "admin";
  email: string;
};

interface MenuDrawerProps {
  isOpen: boolean;
  currentFilter: FilterType;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    ended: number;
  };
  onClose?: () => void;
  onChangeFilter?: (filter: FilterType) => void;
}

export function MenuDrawer({
  isOpen,
  currentFilter,
  counts,
  onClose,
  onChangeFilter,
}: MenuDrawerProps) {
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

  return (
    <>
      <div className={`menu-overlay fixed inset-0 z-[3000] bg-black/40 transition-opacity ${isOpen ? "open opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

      <div className={`menu-drawer fixed top-0 right-0 bottom-0 z-[3001] w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform ${isOpen ? "open translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-extrabold text-base">Navios</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 transition">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">フィルター</p>
          <div className="space-y-1">
            {[
              ["all", "🗺", "すべて", counts.all],
              ["today", "🔥", "TODAY", counts.today],
              ["upcoming", "📅", "開催予定", counts.upcoming],
              ["ended", "🕐", "終了済み", counts.ended],
            ].map(([key, icon, label, count]) => {
              const filter = key as FilterType;
              const active = currentFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onChangeFilter?.(filter)}
                  className={`menu-filter-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition hover:bg-surface-50 ${active ? "bg-brand-50" : ""}`}
                  data-filter={filter}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="ml-auto text-xs text-slate-400 font-medium">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-surface-100 mx-4" />
        <div className="p-4">
          {loading ? null : actor ? (
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
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
