"use client";

import { useEffect } from "react";
import { PostLocationPickerInner as LeafletPostLocationPicker } from "../PostLocationPickerInner";
import type { PostLocationPickerCanvasProps } from "../types";

export function GooglePostLocationPickerFallback(props: PostLocationPickerCanvasProps) {
  useEffect(() => {
    // Google Maps SDK is not wired yet; fallback keeps behavior stable.
    console.warn("NEXT_PUBLIC_MAP_PROVIDER=google is set, but Google location picker is not implemented yet. Falling back to Leaflet.");
  }, []);

  return <LeafletPostLocationPicker {...props} />;
}

