"use client";

import dynamic from "next/dynamic";
import { getClientMapProvider } from "@/lib/map-provider";
import type { PostLocationPickerCanvasProps } from "./types";

const LeafletPostLocationPicker = dynamic(
  () => import("./PostLocationPickerInner").then((mod) => mod.PostLocationPickerInner),
  { ssr: false },
);

const GooglePostLocationPickerFallback = dynamic(
  () =>
    import("./providers/GooglePostLocationPickerFallback").then(
      (mod) => mod.GooglePostLocationPickerFallback,
    ),
  { ssr: false },
);

export function PostLocationPicker(props: PostLocationPickerCanvasProps) {
  const provider = getClientMapProvider();
  if (provider === "google") {
    return <GooglePostLocationPickerFallback {...props} />;
  }
  return <LeafletPostLocationPicker {...props} />;
}
