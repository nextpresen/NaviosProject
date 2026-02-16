"use client";

import { useEffect } from "react";
import { MapInner as LeafletMapCanvas } from "../MapInner";
import type { MapCanvasProps } from "../types";

export function GoogleMapCanvasFallback(props: MapCanvasProps) {
  useEffect(() => {
    // Google Maps SDK is not wired yet; fallback keeps behavior stable.
    console.warn("NEXT_PUBLIC_MAP_PROVIDER=google is set, but Google map canvas is not implemented yet. Falling back to Leaflet.");
  }, []);

  return <LeafletMapCanvas {...props} />;
}

