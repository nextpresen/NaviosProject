"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostCreateInput, PostStatus } from "@/types/post";
import { Button, Input, TextArea, Select } from "@/components/ui";
import { PostImageUpload } from "./PostImageUpload";
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE } from "@/lib/constants";

type Props = {
  mode?: "create" | "edit";
  showStatusField?: boolean;
  initialData?: Partial<PostCreateInput>;
  postId?: string;
  redirectTo?: string;
};

const statusOptions = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" },
  { value: "expired", label: "掲載終了" },
];

export function PostForm({
  mode = "create",
  showStatusField = false,
  initialData,
  postId,
  redirectTo = "/",
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PostCreateInput>({
    title: initialData?.title ?? "",
    content: initialData?.content ?? "",
    image_url: initialData?.image_url ?? null,
    latitude: initialData?.latitude ?? DEFAULT_LATITUDE,
    longitude: initialData?.longitude ?? DEFAULT_LONGITUDE,
    event_date: initialData?.event_date ?? "",
    author_name: initialData?.author_name ?? "",
    expire_date: initialData?.expire_date ?? "",
    status: initialData?.status ?? (showStatusField ? "draft" : "published"),
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof PostCreateInput>(
    key: K,
    value: PostCreateInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const fd = new FormData();
    fd.append("image", imageFile);

    const res = await fetch("/api/uploads", { method: "POST", body: fd });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? "画像アップロードに失敗しました");
    }

    const body = (await res.json()) as { url: string };
    return body.url;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const uploadedUrl = await uploadImage();

      const payload = {
        ...form,
        image_url: uploadedUrl ?? form.image_url,
      };

      const url =
        mode === "edit" ? `/api/posts/${postId}` : "/api/posts";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "投稿の保存に失敗しました");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーです");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">
        {mode === "edit" ? "投稿を編集" : "投稿作成フォーム"}
      </h2>

      <Input
        id="title"
        label="タイトル"
        required
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
      />

      <TextArea
        id="content"
        label="本文"
        required
        rows={4}
        value={form.content}
        onChange={(e) => update("content", e.target.value)}
      />

      <PostImageUpload onFileSelect={setImageFile} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="latitude"
          label="緯度"
          required
          type="number"
          step="0.000001"
          value={form.latitude}
          onChange={(e) => update("latitude", Number(e.target.value))}
        />
        <Input
          id="longitude"
          label="経度"
          required
          type="number"
          step="0.000001"
          value={form.longitude}
          onChange={(e) => update("longitude", Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="event_date"
          label="イベント日"
          required
          type="date"
          value={form.event_date}
          onChange={(e) => update("event_date", e.target.value)}
        />
        <Input
          id="expire_date"
          label="掲載終了日"
          required
          type="date"
          value={form.expire_date}
          onChange={(e) => update("expire_date", e.target.value)}
        />
      </div>

      {showStatusField && (
        <Select
          id="status"
          label="公開状態"
          value={form.status}
          onChange={(e) => update("status", e.target.value as PostStatus)}
          options={statusOptions}
        />
      )}

      <Input
        id="author_name"
        label="投稿者名"
        required
        value={form.author_name}
        onChange={(e) => update("author_name", e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={saving}>
        {mode === "edit" ? "更新する" : "投稿を作成"}
      </Button>
    </form>
  );
}
