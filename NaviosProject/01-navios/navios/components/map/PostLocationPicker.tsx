"use client";

import dynamic from "next/dynamic";

interface PostLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}

const PostLocationPickerImpl = dynamic(
  () => import("./PostLocationPickerInner").then((mod) => mod.PostLocationPickerInner),
  { ssr: false },
);

export function PostLocationPicker(props: PostLocationPickerProps) {
  return <PostLocationPickerImpl {...props} />;
}
