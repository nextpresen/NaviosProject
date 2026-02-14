"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrCreateActorId } from "@/lib/client-actor";

type EventActionsProps = {
  id: string;
};

export function EventActions({ id }: EventActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);

  useEffect(() => {
    setActorId(getOrCreateActorId());
  }, []);

  const onDelete = async () => {
    const ok = window.confirm("この投稿を削除しますか？");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: actorId ? { "x-user-id": actorId } : undefined,
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
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
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
      ) : null}
    </div>
  );
}
