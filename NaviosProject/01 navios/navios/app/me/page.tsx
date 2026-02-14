import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionActorFromServer } from "@/lib/auth-session";

export default async function MePage() {
  const actor = await getSessionActorFromServer();

  if (!actor) {
    redirect("/login");
  }

  const displayName = actor.email.split("@")[0] || actor.userId;

  return (
    <main className="min-h-[100dvh] bg-slate-100 p-4 md:p-8">
      <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">ログインユーザー</h1>
        <p className="mt-1 text-sm text-slate-500">現在ログイン中のアカウント情報です。</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a4 4 0 00-8 0" />
                <circle cx="11" cy="8" r="3" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-500">ユーザー名</p>
              <p className="text-xl font-extrabold text-slate-900">{displayName}</p>
              <p className="mt-1 text-sm text-slate-500">{actor.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
