"use client";

import type { ChangeEvent } from "react";
import { SearchResults, type SearchResultItem } from "./SearchResults";
export type { SearchResultItem } from "./SearchResults";

interface SearchInputProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  results?: SearchResultItem[];
  resultsOpen?: boolean;
  onSelectResult?: (item: SearchResultItem) => void;
  className?: string;
  compact?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "場所・イベントを検索...",
  results = [],
  resultsOpen = false,
  onSelectResult,
  className = "",
  compact = false,
}: SearchInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value);

  return (
    <div className={`relative ${className}`}>
      <svg
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full ${compact ? "pl-9 pr-3 py-2 text-sm" : "pl-10 pr-4 py-2.5 text-sm"} bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition`}
      />
      <SearchResults items={results} isOpen={resultsOpen} onSelect={onSelectResult} />
    </div>
  );
}
