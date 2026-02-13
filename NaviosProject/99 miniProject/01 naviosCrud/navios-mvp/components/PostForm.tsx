"use client";

import { useState } from "react";
import type { PostInput, PostStatus } from "@/types/post";

const initialState: PostInput = {
  title: "",
  content: "",
  image_url: null,
  latitude: 35.681236,
  longitude: 139.767125,
  event_date: "",
  author_name: "",
  expire_date: "",
  status: "draft"
};

type Props = {
  onCreated: () => Promise<void>;
};

export function PostForm({ onCreated }: Props) {
  const [form, setForm] = useState<PostInput>(initialState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const fd = new FormData();
    fd.append("image", imageFile);

    const res = await fetch("/api/uploads", {
      method: "POST",
      body: fd
    });

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

      const payload: PostInput = {
        ...form,
        image_url: uploadedUrl ?? form.image_url
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "投稿の作成に失敗しました");
      }

      setForm(initialState);
      setImageFile(null);
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーです");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">投稿作成フォーム</h2>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">タイトル</label>
        <input
          id="title"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium">本文</label>
        <textarea
          id="content"
          required
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="image" className="mb-1 block text-sm font-medium">画像 (任意)</label>
        <input
          id="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-slate-500">対応形式: JPG / PNG / WEBP、最大5MB</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="latitude" className="mb-1 block text-sm font-medium">緯度</label>
          <input
            id="latitude"
            required
            type="number"
            step="0.000001"
            value={form.latitude}
            onChange={(e) => update("latitude", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="longitude" className="mb-1 block text-sm font-medium">経度</label>
          <input
            id="longitude"
            required
            type="number"
            step="0.000001"
            value={form.longitude}
            onChange={(e) => update("longitude", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="event_date" className="mb-1 block text-sm font-medium">イベント日</label>
          <input
            id="event_date"
            required
            type="date"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="expire_date" className="mb-1 block text-sm font-medium">掲載終了日</label>
          <input
            id="expire_date"
            required
            type="date"
            value={form.expire_date}
            onChange={(e) => update("expire_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">公開状態</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => update("status", e.target.value as PostStatus)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="expired">expired</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="author_name" className="mb-1 block text-sm font-medium">投稿者名</label>
        <input
          id="author_name"
          required
          value={form.author_name}
          onChange={(e) => update("author_name", e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {saving ? "保存中..." : "投稿を作成"}
      </button>
    </form>
  );
}
