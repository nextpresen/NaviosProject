"use client";

import dynamic from "next/dynamic";
import { getClientMapProvider } from "@/lib/map-provider";
import type { MapCanvasProps } from "./types";

const LeafletMapCanvas = dynamic(
  () => import("./MapInner").then((mod) => mod.MapInner),
  { ssr: false },
);

const GoogleMapCanvasFallback = dynamic(
  () => import("./providers/GoogleMapCanvasFallback").then((mod) => mod.GoogleMapCanvasFallback),
  { ssr: false },
);

export function MapCanvas(props: MapCanvasProps) {
  const provider = getClientMapProvider();
  if (provider === "google") {
    return <GoogleMapCanvasFallback {...props} />;
  }
  return <LeafletMapCanvas {...props} />;
}

