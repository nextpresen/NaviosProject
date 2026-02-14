"use client";

import Image from "next/image";
import { SearchInput, type SearchResultItem } from "../search/SearchInput";

interface MobileHeaderProps {
  searchQuery: string;
  onSearchChange?: (value: string) => void;
  searchResults?: SearchResultItem[];
  searchResultsOpen?: boolean;
  onSearchSelect?: (item: SearchResultItem) => void;
  onOpenMenu?: () => void;
}

export function MobileHeader({
  searchQuery,
  onSearchChange,
  searchResults = [],
  searchResultsOpen = false,
  onSearchSelect,
  onOpenMenu,
}: MobileHeaderProps) {
  return (
    <header className="flex lg:hidden flex-shrink-0 items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xl border-b border-surface-200 z-[1100]">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow shadow-brand-500/20">
        <Image src="/navios-logo.svg" alt="Navios logo" width={24} height={24} className="w-6 h-6" />
      </div>

      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        results={searchResults}
        resultsOpen={searchResultsOpen}
        onSelectResult={onSearchSelect}
        className="flex-1"
        compact
      />

      <button
        type="button"
        onClick={onOpenMenu}
        className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-200 hover:bg-surface-100 transition flex-shrink-0"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}
