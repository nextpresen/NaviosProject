# NaviOs MVP (navios-mvp)

`claude.md` の要件に合わせて作成した、`Next.js + TypeScript + Tailwind + Supabase` の最小構成です。

## 1. セットアップ

```bash
cd "/home/zer0/ドキュメント/NaviosProject/99 miniProject/01 naviosCrud/navios-mvp"
npm install
cp .env.example .env.local
```

`.env.local` に以下を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## 2. Supabase 設定

1. Supabaseで新規プロジェクト作成
2. `SQL Editor` で `db/schema.sql` を実行
3. `Project Settings > API` から URL / anon key / service_role key を取得
4. 上記キーを `.env.local` に設定

既存DBに後から画像機能を追加する場合は、最低でも以下を実行してください。

```sql
alter table if exists public.posts add column if not exists image_url text;
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;
```

## 3. ローカル起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開くと、投稿作成（画像付き）と投稿一覧確認ができます。

## 4. Vercel デプロイ手順

1. GitHubへpush
2. Vercelで `New Project` からリポジトリを選択
3. Build設定はデフォルト(Next.js)
4. `Environment Variables` に以下を登録
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy実行

## 5. 現在の実装範囲

- 管理画面
- 投稿作成フォーム
  - `title`
  - `content`
  - `image_url` (Storageにアップロード)
  - `latitude` / `longitude`
  - `event_date`
  - `author_name`
  - `expire_date`
  - `status` (`draft` / `published` / `expired`)
- 投稿一覧( `created_at` 降順 )

## 6. 次にやると良いこと

- `PUT / DELETE` API追加
- バリデーション強化(zod導入など)
- 認証(RLS)の導入
- 地図UI連携
