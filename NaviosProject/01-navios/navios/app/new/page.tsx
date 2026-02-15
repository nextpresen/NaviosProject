"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { PostLocationPicker } from "@/components/map/PostLocationPicker";
import { SearchInput, type SearchResultItem } from "@/components/search/SearchInput";
import { EVENT_CATEGORY_OPTIONS, EVENT_TAG_OPTIONS } from "@/lib/event-taxonomy";
import { useGeocode } from "@/hooks/useGeocode";
import type { Event, EventCategory, EventTag } from "@/types/event";

type FormState = {
  title: string;
  content: string;
  category: EventCategory;
  tags: EventTag[];
  latitude: string;
  longitude: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  event_date: string;
  expire_date: string;
  event_image: string;
};

function serializeFormState(form: FormState) {
  return JSON.stringify({
    ...form,
    tags: [...form.tags].sort(),
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toDateTimeLocalInput(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function dateFromDateTimeLocal(value: string) {
  return value.slice(0, 10);
}

function withTime(date: string, time: string) {
  return `${date}T${time}`;
}

function toCoordinate(value: string, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました。"));
    };
    img.src = url;
  });
}

function calcBase64Size(dataUrl: string) {
  const payload = dataUrl.split(",")[1] ?? "";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}

async function cropAndOptimizeImage(file: File) {
  const image = await loadImageFromFile(file);
  const sourceW = image.naturalWidth;
  const sourceH = image.naturalHeight;
  const targetRatio = 3 / 2;

  let cropW = sourceW;
  let cropH = sourceH;
  let cropX = 0;
  let cropY = 0;

  if (sourceW / sourceH > targetRatio) {
    cropW = Math.floor(sourceH * targetRatio);
    cropX = Math.floor((sourceW - cropW) / 2);
  } else {
    cropH = Math.floor(sourceW / targetRatio);
    cropY = Math.floor((sourceH - cropH) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("画像処理に失敗しました。");
  }

  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

  const supportsWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  const mime = supportsWebP ? "image/webp" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mime, 0.8);
  return { dataUrl, sizeBytes: calcBase64Size(dataUrl) };
}

export default function NewEventPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEdit = Boolean(editingId);
  const today = useMemo(() => todayIso(), []);
  const defaultStartAt = useMemo(() => withTime(today, "09:00"), [today]);
  const defaultEndAt = useMemo(() => withTime(today, "18:00"), [today]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const initialForm = useMemo<FormState>(() => ({
    title: "",
    content: "",
    category: "event",
    tags: [],
    latitude: "31.57371",
    longitude: "130.345154",
    start_at: defaultStartAt,
    end_at: defaultEndAt,
    is_all_day: false,
    event_date: today,
    expire_date: today,
    event_image: "https://placehold.co/1200x800/2a91ff/ffffff?text=Navios+Event",
  }), [defaultEndAt, defaultStartAt, today]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [initialFormSnapshot, setInitialFormSnapshot] = useState(() => serializeFormState(initialForm));

  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [showAddressResults, setShowAddressResults] = useState(false);
  const { results: geocodeResults, loading: geocodeLoading } = useGeocode(addressQuery);
  const isDirty = useMemo(
    () => serializeFormState(form) !== initialFormSnapshot,
    [form, initialFormSnapshot],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | {
              data?: {
                actor?: {
                  userId?: string;
                } | null;
              };
            }
          | null;
        const actor = payload?.data?.actor;
        if (!cancelled) {
          setCanPost(Boolean(actor?.userId));
        }
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

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
          const startAt = event.start_at ? toDateTimeLocalInput(event.start_at) : withTime(event.event_date, "09:00");
          const endAt = event.end_at ? toDateTimeLocalInput(event.end_at) : withTime(event.expire_date, "18:00");
          const loadedForm: FormState = {
            ...event,
            category: event.category ?? "event",
            tags: event.tags ?? [],
            start_at: startAt,
            end_at: endAt,
            is_all_day: event.is_all_day ?? false,
            event_date: dateFromDateTimeLocal(startAt),
            expire_date: dateFromDateTimeLocal(endAt),
            latitude: String(event.latitude),
            longitude: String(event.longitude),
          };
          setForm(loadedForm);
          setInitialFormSnapshot(serializeFormState(loadedForm));
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

  useEffect(() => {
    if (editingId) return;
    setInitialFormSnapshot(serializeFormState(initialForm));
  }, [editingId, initialForm]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateStartAt = (value: string) => {
    setForm((prev) => ({
      ...prev,
      start_at: value,
      event_date: dateFromDateTimeLocal(value),
    }));
  };

  const updateEndAt = (value: string) => {
    setForm((prev) => ({
      ...prev,
      end_at: value,
      expire_date: dateFromDateTimeLocal(value),
    }));
  };

  const toggleAllDay = (checked: boolean) => {
    setForm((prev) => {
      if (!checked) {
        return { ...prev, is_all_day: false };
      }
      const startDate = dateFromDateTimeLocal(prev.start_at);
      const endDate = dateFromDateTimeLocal(prev.end_at);
      return {
        ...prev,
        is_all_day: true,
        start_at: withTime(startDate, "00:00"),
        end_at: withTime(endDate, "23:59"),
        event_date: startDate,
        expire_date: endDate,
      };
    });
  };

  const handleBackToHome = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isDirty) {
      const confirmed = window.confirm("変更を破棄して戻りますか？");
      if (!confirmed) return;
    }
    router.push("/");
  };

  const toggleTag = (tag: EventTag) => {
    setForm((prev) => {
      const exists = prev.tags.includes(tag);
      if (exists) {
        return { ...prev, tags: prev.tags.filter((item) => item !== tag) };
      }
      if (prev.tags.length >= 3) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
  };

  const mapLatitude = toCoordinate(form.latitude, -90, 90) ?? 31.57371;
  const mapLongitude = toCoordinate(form.longitude, -180, 180) ?? 130.345154;

  const handleMapLocationChange = (latitude: number, longitude: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  };

  const addressItems: SearchResultItem[] = useMemo(
    () =>
      geocodeResults.map((item) => ({
        id: item.id,
        title: item.displayName.split(",")[0] ?? item.displayName,
        subtitle: item.displayName,
        lat: item.lat,
        lon: item.lon,
      })),
    [geocodeResults],
  );

  const onSelectAddress = (item: SearchResultItem) => {
    if (typeof item.lat !== "number" || typeof item.lon !== "number") return;
    handleMapLocationChange(item.lat, item.lon);
    setAddressQuery(item.subtitle ?? item.title);
    setShowAddressResults(false);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("元画像サイズは15MB以下にしてください。");
      return;
    }

    setError(null);
    setWarning(null);
    setReadingImage(true);
    void cropAndOptimizeImage(file)
      .then(({ dataUrl, sizeBytes }) => {
        update("event_image", dataUrl);
        if (sizeBytes > 2 * 1024 * 1024) {
          setWarning("最適化後でも2MBを超えています。軽量な画像の利用を推奨します。");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "画像の処理に失敗しました。");
      })
      .finally(() => {
        setReadingImage(false);
      });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPost) {
      setError("ログインが必要です。");
      return;
    }
    setError(null);
    setSubmitting(true);

    const startAtDate = new Date(form.start_at);
    const endAtDate = new Date(form.end_at);
    if (Number.isNaN(startAtDate.getTime()) || Number.isNaN(endAtDate.getTime())) {
      setError("開始日時と終了日時を正しく入力してください。");
      setSubmitting(false);
      return;
    }

    const startAtIso = startAtDate.toISOString();
    const endAtIso = endAtDate.toISOString();
    const eventDate = dateFromDateTimeLocal(form.start_at);
    const expireDate = dateFromDateTimeLocal(form.end_at);

    if (endAtDate < startAtDate) {
      setError("終了日時は開始日時より後にしてください。");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(isEdit ? `/api/events/${editingId}` : "/api/events", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          tags: form.tags,
          start_at: startAtIso,
          end_at: endAtIso,
          is_all_day: form.is_all_day,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          event_date: eventDate,
          expire_date: expireDate,
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
              {isEdit ? "投稿を編集" : "投稿する"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit ? "イベント情報を更新します。" : "イベント情報を入力して公開します。"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-3.5 py-2 hover:bg-slate-50"
          >
            トップへ戻る
          </button>
        </div>

        {checkingAuth ? (
          <p className="rounded-lg bg-slate-100 text-slate-600 text-sm px-3 py-2">認証状態を確認中...</p>
        ) : !canPost ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-amber-50 text-amber-800 text-sm px-3 py-2">
              ログインが必要です。ログイン後に投稿できます。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl bg-slate-900 text-white text-sm font-bold px-5 py-2.5"
              >
                ログインへ進む
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2.5"
              >
                トップへ戻る
              </Link>
            </div>
          </div>
        ) : (
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
              {EVENT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="block">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">タグ（最大3つ）</span>
              <span className="text-[11px] font-semibold text-slate-500">{form.tags.length}/3</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_TAG_OPTIONS.map((option) => {
                const selected = form.tags.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleTag(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="block">
            <span className="text-sm font-semibold text-slate-700">位置選択ミニマップ</span>
            <p className="mt-1 text-xs text-slate-500">
              中央固定（推奨）は、地図をスワイプ/ピンチして中心を合わせるだけで座標が確定します。
            </p>
            <div className="mt-2">
              <PostLocationPicker
                latitude={mapLatitude}
                longitude={mapLongitude}
                onChange={handleMapLocationChange}
              />
            </div>
          </div>

          <div className="block">
            <span className="text-sm font-semibold text-slate-700">住所で選択</span>
            <p className="mt-1 text-xs text-slate-500">
              住所を入力して候補を選ぶと、ミニマップ位置と座標が自動で更新されます。
            </p>
            <div className="mt-2">
              <SearchInput
                value={addressQuery}
                onChange={(value) => {
                  setAddressQuery(value);
                  setShowAddressResults(true);
                }}
                placeholder="例: 鹿児島県日置市..."
                results={addressItems}
                resultsOpen={showAddressResults && addressItems.length > 0}
                onSelectResult={onSelectAddress}
                compact
              />
              {geocodeLoading ? (
                <p className="mt-1.5 text-xs text-slate-500">住所を検索中...</p>
              ) : null}
            </div>
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              緯度・経度を手入力する（上級者向け）
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </details>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <span className="text-sm font-semibold text-slate-700">開催日時</span>

            <label
              htmlFor="is-all-day"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 cursor-pointer"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">終日イベント</p>
                <p className="text-[11px] text-slate-500">開始 00:00 / 終了 23:59 で保存</p>
              </div>
              <span className="inline-flex items-center gap-2">
                <span className={`text-[11px] font-bold ${form.is_all_day ? "text-emerald-600" : "text-slate-400"}`}>
                  {form.is_all_day ? "ON" : "OFF"}
                </span>
                <span className="relative inline-flex h-6 w-11 items-center">
                  <input
                    id="is-all-day"
                    type="checkbox"
                    checked={form.is_all_day}
                    onChange={(e) => toggleAllDay(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">開始日時</span>
                <input
                  required
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => updateStartAt(e.target.value)}
                  disabled={form.is_all_day}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">終了日時</span>
                <input
                  required
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => updateEndAt(e.target.value)}
                  disabled={form.is_all_day}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500">
              終日イベントをONにすると、開始 00:00 / 終了 23:59 として保存されます。
            </p>
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
              3:2中央トリミング + 1200x800 + 品質0.8（WebP/JPEG）で自動最適化します。
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
                className="h-44 w-full rounded-lg object-contain bg-slate-100"
              />
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
          ) : null}
          {warning ? (
            <p className="rounded-lg bg-amber-50 text-amber-800 text-sm px-3 py-2">{warning}</p>
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
        )}
      </div>
    </main>
  );
}
