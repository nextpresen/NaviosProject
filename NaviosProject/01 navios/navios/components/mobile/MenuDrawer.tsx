"use client";

import type { FilterType } from "../ui/FilterTabs";
import type { MapStyle } from "../map/MapStyleToggle";

interface MenuDrawerProps {
  isOpen: boolean;
  currentFilter: FilterType;
  mapStyle: MapStyle;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    ended: number;
  };
  onClose?: () => void;
  onChangeFilter?: (filter: FilterType) => void;
  onChangeStyle?: (style: MapStyle) => void;
}

export function MenuDrawer({
  isOpen,
  currentFilter,
  mapStyle,
  counts,
  onClose,
  onChangeFilter,
  onChangeStyle,
}: MenuDrawerProps) {
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">マップスタイル</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["voyager", "🗺", "Standard"],
              ["light", "☀️", "Light"],
              ["dark", "🌙", "Dark"],
            ].map(([key, icon, label]) => {
              const style = key as MapStyle;
              const active = mapStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => onChangeStyle?.(style)}
                  className={`menu-style-btn flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition ${
                    active ? "border-brand-500 bg-brand-50" : "border-transparent hover:border-surface-200"
                  }`}
                  data-style={style}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${style === "dark" ? "bg-slate-800" : style === "light" ? "bg-slate-50" : "bg-slate-100"}`}>
                    {icon}
                  </span>
                  <span className={`text-[11px] font-semibold ${active ? "text-slate-800" : "text-slate-500"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-surface-100 mx-4" />
        <div className="p-4">
          <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-50 transition">
            <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-sm font-semibold">新規投稿</span>
          </button>
        </div>
      </div>
    </>
  );
}
