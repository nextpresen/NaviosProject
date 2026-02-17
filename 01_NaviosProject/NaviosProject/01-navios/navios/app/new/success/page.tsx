import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "投稿しました",
  description: "投稿が完了しました。内容確認や続けて投稿ができます。",
};

interface SuccessPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function NewSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const eventId = typeof params.id === "string" ? params.id.trim() : "";
  const hasEventId = eventId.length > 0;

  return (
    <main className="min-h-[100dvh] bg-slate-100 px-4 py-8 md:px-6">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7 text-emerald-600"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 8" />
          </svg>
        </div>

        <h1 className="text-center text-2xl font-extrabold text-slate-900">投稿しました</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          投稿ありがとうございます。公開された内容を確認するか、続けて次の投稿を作成できます。
        </p>

        {!hasEventId ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
            投稿IDが見つからないため、投稿詳細へ移動できません。
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          {hasEventId ? (
            <Link
              href={`/event/${eventId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"
            >
              投稿を見る
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-300 px-4 text-sm font-bold text-slate-600"
            >
              トップへ移動する
            </Link>
          )}

          <Link
            href="/new"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            続けて投稿する
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
