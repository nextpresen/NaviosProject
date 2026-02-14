"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Event, EventCategory } from "@/types/event";

type FormState = {
  title: string;
  content: string;
  category: EventCategory;
  latitude: string;
  longitude: string;
  event_date: string;
  expire_date: string;
  event_image: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewEventPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEdit = Boolean(editingId);
  const today = useMemo(() => todayIso(), []);

  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    category: "other",
    latitude: "31.57371",
    longitude: "130.345154",
    event_date: today,
    expire_date: today,
    event_image: "https://placehold.co/1200x800/2a91ff/ffffff?text=Navios+Event",
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditingId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;

    const run = async () => {
      setLoadingExisting(true);
      setError(null);
      try {
        const response = await fetch(`/api/events/${editingId}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | {
              event?: Event;
              data?: { event?: Event };
              error?: { message?: string };
            }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "既存データの取得に失敗しました");
        }

        const event = payload?.event ?? payload?.data?.event;
        if (!event) {
          throw new Error("既存データを取得できませんでした");
        }

        if (!cancelled) {
          setForm({
            ...event,
            category: event.category ?? "other",
            latitude: String(event.latitude),
            longitude: String(event.longitude),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "既存データの取得に失敗しました");
        }
      } finally {
        if (!cancelled) {
          setLoadingExisting(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("画像サイズは5MB以下にしてください。");
      return;
    }

    setError(null);
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        setError("画像の読み込みに失敗しました。");
        setReadingImage(false);
        return;
      }
      update("event_image", result);
      setReadingImage(false);
    };
    reader.onerror = () => {
      setError("画像の読み込みに失敗しました。");
      setReadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(isEdit ? `/api/events/${editingId}` : "/api/events", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          event_date: form.event_date,
          expire_date: form.expire_date,
          event_image: form.event_image,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            event?: { id: string };
            data?: { event?: { id: string } };
            error?: { code?: string; message?: string };
          }
        | null;

      if (!response.ok) {
        const code = payload?.error?.code;
        if (code === "UNAUTHORIZED") {
          throw new Error("ログイン後に投稿・更新できます。");
        }
        if (code === "FORBIDDEN") {
          throw new Error("この投稿を更新する権限がありません。");
        }
        throw new Error(payload?.error?.message ?? "保存に失敗しました");
      }

      const id = payload?.event?.id ?? payload?.data?.event?.id;
      if (!id) {
        throw new Error("保存後のイベントIDを取得できませんでした");
      }

      router.push(`/event/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-7">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
              {isEdit ? "投稿を編集" : "新規投稿"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit ? "イベント情報を更新します。" : "イベント情報を入力して公開します。"}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-3.5 py-2 hover:bg-slate-50"
          >
            トップへ戻る
          </Link>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">タイトル</span>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="例: 日置市 春の花まつり"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">本文</span>
            <textarea
              required
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              className="mt-1.5 w-full min-h-28 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="イベント説明"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">カテゴリ</span>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as EventCategory)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="other">その他</option>
              <option value="festival">祭り</option>
              <option value="gourmet">グルメ</option>
              <option value="nature">自然</option>
              <option value="culture">文化</option>
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">緯度</span>
              <input
                required
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">経度</span>
              <input
                required
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">開始日</span>
              <input
                required
                type="date"
                value={form.event_date}
                onChange={(e) => update("event_date", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">終了日</span>
              <input
                required
                type="date"
                value={form.expire_date}
                onChange={(e) => update("expire_date", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">画像アップロード</span>
            <input
              required={!isEdit}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              JPG / PNG / WebP / GIF（5MBまで）
            </p>
          </label>

          {form.event_image ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <Image
                src={form.event_image}
                alt="preview"
                width={1200}
                height={800}
                unoptimized
                className="h-44 w-full rounded-lg object-cover"
              />
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || loadingExisting || readingImage}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-60"
            >
              {submitting ? "保存中..." : readingImage ? "画像処理中..." : isEdit ? "更新する" : "投稿する"}
            </button>
            {isEdit && editingId ? (
              <Link
                href={`/event/${editingId}`}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2.5"
              >
                詳細へ戻る
              </Link>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}
