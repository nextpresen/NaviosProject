"use client";

import { create } from "zustand";
import type { EventFilter, MapStyle } from "@/types/event";

interface AppState {
  filter: EventFilter;
  searchQuery: string;
  selectedEventId: string | null;
  mapStyle: MapStyle;
  isMenuOpen: boolean;
  isBottomSheetOpen: boolean;
  setFilter: (filter: EventFilter) => void;
  setSearchQuery: (query: string) => void;
  selectEvent: (id: string | null) => void;
  setMapStyle: (style: MapStyle) => void;
  setMenu: (open: boolean) => void;
  toggleMenu: () => void;
  setBottomSheet: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  filter: "all",
  searchQuery: "",
  selectedEventId: null,
  mapStyle: "voyager",
  isMenuOpen: false,
  isBottomSheetOpen: false,
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  selectEvent: (selectedEventId) => set({ selectedEventId }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setMenu: (isMenuOpen) => set({ isMenuOpen }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setBottomSheet: (isBottomSheetOpen) => set({ isBottomSheetOpen }),
}));
