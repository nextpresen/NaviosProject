"use client";

import type { FilterType } from "../ui/FilterTabs";

interface MobileFilterBarProps {
  activeFilter: FilterType;
  counts: { all: number; today: number; upcoming: number; ended: number };
  onChange?: (filter: FilterType) => void;
}

const FILTERS: Array<{
  key: FilterType;
  label: string;
  activeClass: string;
}> = [
  { key: "all", label: "ALL", activeClass: "bg-slate-800 text-white" },
  {
    key: "today",
    label: "LIVE NOW",
    activeClass:
      "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_4px_12px_rgba(219,39,119,0.3)]",
  },
  { key: "upcoming", label: "SOON", activeClass: "bg-blue-600 text-white" },
  { key: "ended", label: "FINISHED", activeClass: "bg-slate-500 text-white" },
];

export function MobileFilterBar({
  activeFilter,
  counts,
  onChange,
}: MobileFilterBarProps) {
  return (
    <div className="lg:hidden absolute top-1.5 left-0 right-0 z-[1050] px-3 py-1">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const isActive = f.key === activeFilter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onChange?.(f.key)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 border border-white/60 shadow-lg backdrop-blur-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                isActive ? f.activeClass : "bg-white/85 text-slate-600"
              }`}
            >
              <span className="text-[11px] font-extrabold tracking-wide whitespace-nowrap text-center leading-none">
                {f.label}
              </span>
              <span
                className={`text-[10px] font-bold text-center leading-none ${isActive ? "opacity-80" : "text-slate-400"}`}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
