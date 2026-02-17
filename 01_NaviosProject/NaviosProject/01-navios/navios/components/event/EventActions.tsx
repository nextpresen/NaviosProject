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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      {canManage ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">管理操作</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/new?id=${id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white text-red-700 text-sm font-semibold px-5 py-2.5 hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          この投稿は作成者または管理者のみ編集・削除できます
        </p>
      )}
    </div>
  );
}
