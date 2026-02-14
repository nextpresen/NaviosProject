"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type FormState = {
  title: string;
  content: string;
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
  const today = useMemo(() => todayIso(), []);

  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    latitude: "31.57371",
    longitude: "130.345154",
    event_date: today,
    expire_date: today,
    event_image: "https://placehold.co/1200x800/2a91ff/ffffff?text=Navios+Event",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          event_date: form.event_date,
          expire_date: form.expire_date,
          event_image: form.event_image,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "投稿に失敗しました");
      }

      const payload = (await response.json()) as { event: { id: string } };
      router.push(`/event/${payload.event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-7">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">新規投稿</h1>
        <p className="text-sm text-slate-500 mb-6">イベント情報を入力して公開します。</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">タイトル</span>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="例: 日置市 春の花まつり"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">本文</span>
            <textarea
              required
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              className="mt-1.5 w-full min-h-28 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="イベント説明"
            />
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">終了日</span>
              <input
                required
                type="date"
                value={form.expire_date}
                onChange={(e) => update("expire_date", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">画像URL</span>
            <input
              required
              type="url"
              value={form.event_image}
              onChange={(e) => update("event_image", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-bold px-5 py-2.5 disabled:opacity-60"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </div>
    </main>
  );
}
