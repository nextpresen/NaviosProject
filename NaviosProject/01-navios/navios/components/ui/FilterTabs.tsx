"use client";

export type FilterType = "all" | "today" | "upcoming" | "ended";

interface FilterTabsProps {
  activeFilter: FilterType;
  onChange?: (filter: FilterType) => void;
  className?: string;
}

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "today", label: "LIVE NOW" },
  { key: "upcoming", label: "SOON" },
  { key: "ended", label: "FINISHED" },
];

export function FilterTabs({ activeFilter, onChange, className = "" }: FilterTabsProps) {
  return (
    <div className={`flex gap-1.5 mt-3 flex-wrap ${className}`}>
      {FILTERS.map((filter) => {
        const isActive = filter.key === activeFilter;
        const activeClass = isActive
          ? filter.key === "today"
            ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_8px_18px_rgba(219,39,119,0.28)]"
            : "bg-slate-800 text-white"
          : "text-slate-500 hover:bg-surface-100";
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange?.(filter.key)}
            className={`tab-btn text-xs font-semibold px-3 py-1.5 rounded-lg transition ${activeClass}`}
            data-filter={filter.key}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
