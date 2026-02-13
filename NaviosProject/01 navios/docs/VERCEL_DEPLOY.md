# Vercel デプロイガイド

## 1. 事前準備

- GitHubリポジトリにコードをプッシュ済みであること
- Supabaseのセットアップが完了していること（[SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 参照）

## 2. Vercel へのデプロイ手順

### 2.1 プロジェクトのインポート

1. [vercel.com](https://vercel.com) にアクセスしてログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択
4. 「Import」をクリック

### 2.2 ビルド設定

| 項目 | 値 |
|------|-----|
| Framework Preset | Next.js（自動検出） |
| Root Directory | `01 navios`（モノレポの場合）|
| Build Command | `npm run build`（デフォルト）|
| Output Directory | `.next`（デフォルト）|

### 2.3 環境変数の設定

「Environment Variables」セクションで以下を追加:

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |

### 2.4 デプロイ

「Deploy」をクリックしてデプロイを開始します。

## 3. カスタムドメインの設定

1. Vercel ダッシュボードでプロジェクトを選択
2. 「Settings」→「Domains」を選択
3. `navios.life` を入力して「Add」をクリック
4. 表示されるDNS設定をドメインレジストラで設定:

```
タイプ: CNAME
名前: @
値: cname.vercel-dns.com
```

または A レコード:

```
タイプ: A
名前: @
値: 76.76.21.21
```

5. DNS反映後、自動的にSSL証明書が発行されます

## 4. デプロイ後の設定

### Supabase のリダイレクトURL更新

1. Supabase ダッシュボード →「Authentication」→「URL Configuration」
2. 「Redirect URLs」に本番URLを追加:

```
https://navios.life/api/auth/callback
```

3. 「Site URL」を本番URLに更新:

```
https://navios.life
```

## 5. 継続的デプロイ

- `main` ブランチへのプッシュで自動デプロイが実行されます
- プルリクエストごとにプレビューデプロイが自動生成されます

## トラブルシューティング

### ビルドが失敗する
- Vercelのビルドログを確認
- ローカルで `npm run build` が成功するか確認
- 環境変数がすべて設定されているか確認

### 画像が表示されない
- `next.config.mjs` の `images.remotePatterns` が正しいか確認
- Supabase Storage の URL パターンが許可されているか確認

### 認証リダイレクトが失敗する
- Supabase の「Redirect URLs」に Vercel のデプロイURLが追加されているか確認
- `Site URL` が正しく設定されているか確認
