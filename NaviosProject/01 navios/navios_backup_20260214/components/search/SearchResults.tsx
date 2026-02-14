"use client";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  lat?: number;
  lon?: number;
}

interface SearchResultsProps {
  items: SearchResultItem[];
  isOpen: boolean;
  onSelect?: (item: SearchResultItem) => void;
  className?: string;
}

export function SearchResults({ items, isOpen, onSelect, className = "" }: SearchResultsProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`absolute top-full left-0 right-0 z-[100] bg-white rounded-b-2xl shadow-xl max-h-[260px] overflow-y-auto custom-scroll ${className}`}
    >
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect?.(item)}
          className="search-result-item px-3.5 py-2.5 cursor-pointer border-b border-surface-100 last:border-b-0"
        >
          <p className="text-sm font-semibold text-slate-800 mb-0.5">{item.title}</p>
          {item.subtitle ? <p className="text-xs text-slate-400 truncate">{item.subtitle}</p> : null}
        </div>
      ))}
    </div>
  );
}
