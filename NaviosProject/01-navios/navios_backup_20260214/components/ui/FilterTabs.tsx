"use client";

export type FilterType = "all" | "today" | "upcoming" | "ended";

interface FilterTabsProps {
  activeFilter: FilterType;
  onChange?: (filter: FilterType) => void;
  className?: string;
}

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: "all", label: "すべて" },
  { key: "today", label: "TODAY" },
  { key: "upcoming", label: "開催予定" },
  { key: "ended", label: "終了" },
];

export function FilterTabs({ activeFilter, onChange, className = "" }: FilterTabsProps) {
  return (
    <div className={`flex gap-1.5 mt-3 flex-wrap ${className}`}>
      {FILTERS.map((filter) => {
        const isActive = filter.key === activeFilter;
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange?.(filter.key)}
            className={`tab-btn text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              isActive ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-surface-100"
            }`}
            data-filter={filter.key}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
