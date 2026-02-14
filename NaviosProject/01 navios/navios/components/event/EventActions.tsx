"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type EventActionsProps = {
  id: string;
  canManage: boolean;
};

export function EventActions({ id, canManage }: EventActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    const ok = window.confirm("この投稿を削除しますか？");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as
        | { error?: { code?: string; message?: string } }
        | null;

      if (!response.ok) {
        const code = payload?.error?.code;
        if (code === "UNAUTHORIZED") {
          throw new Error("ログイン後に削除できます。");
        }
        if (code === "FORBIDDEN") {
          throw new Error("この投稿を削除する権限がありません。");
        }
        throw new Error(payload?.error?.message ?? "削除に失敗しました");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      {canManage ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/new?id=${id}`}
            className="inline-flex items-center rounded-xl bg-slate-900 text-white text-sm font-bold px-4 py-2"
          >
            この投稿を編集
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold px-4 py-2 disabled:opacity-60"
          >
            {deleting ? "削除中..." : "この投稿を削除"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">この投稿は作成者または管理者のみ編集・削除できます。</p>
      )}
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
      ) : null}
    </div>
  );
}
