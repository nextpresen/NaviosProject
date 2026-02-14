"use client";

import { useAppStore } from "@/store/useAppStore";

export function useMapState() {
  const mapStyle = useAppStore((state) => state.mapStyle);
  const setMapStyle = useAppStore((state) => state.setMapStyle);
  return { mapStyle, setMapStyle };
}
