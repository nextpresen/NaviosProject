# Supabase セットアップガイド

## 1. Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) にアクセスしてアカウント作成
2. 「New Project」をクリック
3. プロジェクト名: `navios` (任意)
4. データベースパスワードを設定
5. リージョン: `Northeast Asia (Tokyo)` を推奨
6. 「Create new project」をクリック

## 2. データベーススキーマの適用

1. Supabase ダッシュボードの左メニューから「SQL Editor」を選択
2. 「New query」をクリック
3. プロジェクト内の `db/schema.sql` の内容をコピー＆ペースト
4. 「Run」をクリックして実行

これにより以下が作成されます:
- `posts` テーブル（投稿データ）
- `profiles` テーブル（ユーザーロール管理）
- `handle_new_user` トリガー（サインアップ時の自動プロフィール作成）
- `post-images` ストレージバケット
- RLS（行レベルセキュリティ）ポリシー

## 3. 環境変数の取得

1. Supabase ダッシュボードの左メニューから「Project Settings」→「API」を選択
2. 以下の値をコピー:

| 項目 | 環境変数名 | 場所 |
|------|-----------|------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | API Settings → URL |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API Settings → Project API keys |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` | API Settings → Project API keys |

3. プロジェクトルートに `.env.local` ファイルを作成:

```bash
cp .env.example .env.local
```

4. 取得した値を `.env.local` に設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## 4. Authentication 設定

1. 「Authentication」→「Providers」を選択
2. **Email** プロバイダーが有効であることを確認
3. 「Authentication」→「URL Configuration」を選択
4. 以下を設定:

| 項目 | 値 |
|------|-----|
| Site URL | `http://localhost:3000`（開発時）/ `https://navios.life`（本番） |
| Redirect URLs | `http://localhost:3000/api/auth/callback`, `https://navios.life/api/auth/callback` |

## 5. ストレージ確認

1. 「Storage」を選択
2. `post-images` バケットが作成されていることを確認
3. バケットの「Policies」タブで以下のポリシーが設定されていることを確認:
   - `Anyone can view post images` (SELECT)
   - `Authenticated users can upload post images` (INSERT)

## 6. 管理者ユーザーの作成

1. アプリケーションのログイン画面から通常のユーザー登録を行う
2. Supabase ダッシュボードの「SQL Editor」で以下を実行:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

これで該当ユーザーが管理者として `/admin` にアクセスできるようになります。

## トラブルシューティング

### テーブルが見つからない
- SQL Editorで `db/schema.sql` が正しく実行されたか確認
- 「Table Editor」に `posts` と `profiles` テーブルが表示されるか確認

### 画像アップロードが失敗する
- `post-images` バケットが存在するか確認
- バケットが `public` に設定されているか確認
- ストレージのポリシーが正しく設定されているか確認

### 認証が機能しない
- `.env.local` の値が正しいか確認
- Supabase ダッシュボードの「Authentication」→「Users」で登録済みユーザーを確認
