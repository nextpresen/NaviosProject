# Navios Phase1 設計書（Next.js）

最終更新: 2026-02-15
対象: `/home/zer0/ドキュメント/NaviosProject/01-navios/navios`

## 1. プロジェクト概要
- サービス名: Navios
- コンセプト: 地域の「今使える情報」を地図中心で発見・投稿する生活支援アプリ
- Phase1 ゴール:
  - 地図表示 + イベント投稿/編集/削除の一連フローを実運用可能な形で成立させる
  - 認証/認可（owner/admin）を API まで通す
  - 日付のみ運用から、開始/終了時刻を含む判定へ移行する土台を実装する

## 2. 技術スタック
| 領域 | 技術 | 補足 |
|---|---|---|
| フロントエンド基盤 | Next.js 16（App Router） | 画面/ルーティングの中核 |
| 言語/UI | React + TypeScript | 型安全なUI実装 |
| スタイリング | Tailwind CSS | 迅速なUI調整 |
| 地図 | Leaflet + react-leaflet | 地図描画とマーカー表示 |
| ORM | Prisma ORM | DBアクセスとスキーマ管理 |
| データベース | SQLite（ローカル） / PostgreSQL（本番想定） | Supabase接続リハーサル済み |
| 認証 | Auth.js（Credentials） | セッション管理 + owner/admin認可連携 |

## 3. フォルダ構成図
```text
01-navios/                          -- プロジェクトルート
├── docs/                           -- 設計書・仕様書（AI読み込み元）
│   ├── NEXTJS_DESIGN.md            -- 人間向け実装設計書（本書）
│   └── AI_DESIGN.md                -- AI向け要約仕様書
├── navios/                         -- Next.jsアプリ本体
│   ├── app/                        -- App Router（画面/Route Handler）
│   │   ├── page.tsx                -- トップ（地図 + 一覧）
│   │   ├── new/page.tsx            -- 投稿/編集画面
│   │   ├── event/[id]/page.tsx     -- イベント詳細画面
│   │   └── api/                    -- バックエンドAPI群
│   │       ├── events/route.ts     -- イベント一覧/作成API
│   │       ├── events/[id]/route.ts-- イベント詳細/更新/削除API
│   │       ├── geocode/route.ts    -- ジオコーディングAPI
│   │       └── auth/**/route.ts    -- 認証/セッションAPI
│   ├── components/                 -- 画面UIコンポーネント
│   │   ├── map/                    -- 地図UI（ピン/マップ制御）
│   │   ├── event/                  -- イベントカード/詳細UI
│   │   ├── layout/                 -- ヘッダー/サイドバー等
│   │   └── mobile/                 -- モバイル専用UI
│   ├── lib/                        -- 共通ロジック/ユーティリティ
│   ├── hooks/                      -- カスタムReact Hooks
│   ├── store/                      -- Zustand状態管理
│   ├── types/                      -- 型定義
│   ├── prisma/                     -- Prisma schema/seed
│   ├── public/                     -- 静的アセット
│   └── tests/                      -- テスト関連
├── mock/                           -- モック資材
├── claude.md                       -- 補助メモ
└── claudeからの改善案.md            -- 改善案メモ
```

## 4. Phase1 実装スコープ（完了）
### 4.1 コア機能
- 地図上へのイベント表示（ステータス連動ピン）
- イベント一覧（検索/フィルタ/選択）
- イベント詳細ページ
- 新規投稿（`/new`）
- 編集（`/new?id=...`）
- 削除（詳細画面から）

### 4.2 認証・認可
- ログイン/サインアップ/セッション確認
- `author_id` による owner 判定
- `PUT/DELETE /api/events/[id]` は owner/admin のみ許可

### 4.3 時間仕様（段階導入）
- `start_at` / `end_at` / `is_all_day` を導入
- 互換のため `event_date` / `expire_date` も保持
- `LIVE NOW` 判定は `now between start_at and end_at` に変更済み

### 4.4 カテゴリ/タグ
- カテゴリ（固定）:
  - `sale`（セール・特売）
  - `event`（イベント）
  - `gourmet`（グルメ）
  - `household_support`（節約・家計支援）
  - `public_support`（公的支援・相談）
  - `local_news`（地域ニュース）
- タグ（固定・最大3件）:
  - `free`（無料）
  - `under_1000`（1,000円以下）
  - `go_now`（今すぐ行ける）

### 4.5 UI/UX調整（反映済み）
- ロゴ押下で `/` 遷移（PC/SP）
- モバイル右上バッジを `LIVE NOW + 件数` 表示へ変更
- PCは右下カード型ポップアップを採用（地図ピン選択でも表示）
- モバイルは Leaflet ポップアップを利用し、詳細導線を保持
- クラスタリング/スパイダー機能は試行後に撤去（関連コード削除済み）

## 5. 主要画面仕様
### 5.1 トップ（`app/page.tsx`）
- 左: サイドバー（PC）
- 右: マップ
- ストア状態:
  - `filter`
  - `searchQuery`
  - `selectedEventId`
- PC:
  - イベント選択時に右下カード表示
- モバイル:
  - マーカー選択時に Leaflet ポップアップ表示

### 5.2 投稿/編集（`app/new/page.tsx`）
- タイトル/本文/カテゴリ/タグ
- 開始日時/終了日時/終日トグル
- 画像アップロード（圧縮・リサイズ）
- 地図ピッカー + 住所検索
- 未保存状態で戻る時に破棄確認ダイアログ

### 5.3 詳細（`app/event/[id]/page.tsx`）
- 投稿内容表示
- owner/admin のみ編集・削除ボタン表示

## 6. API仕様（Phase1）
- `GET /api/events` 一覧
- `POST /api/events` 作成（認証必須）
- `GET /api/events/[id]` 詳細
- `PUT /api/events/[id]` 更新（owner/admin）
- `DELETE /api/events/[id]` 削除（owner/admin）
- `GET /api/geocode` 地名検索
- `GET/POST /api/auth/[...nextauth]`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET/PATCH /api/auth/profile`

レスポンス形式は `ok/data/error` を基準に統一（互換キー併用あり）。

## 7. データモデル（要点）
### 7.1 Event
- 識別/本文: `id`, `title`, `content`
- 投稿者: `author_id`, `author_avatar_url`
- 分類: `category`, `tags_json`
- 位置: `latitude`, `longitude`
- 時間: `start_at`, `end_at`, `is_all_day`, `event_date`, `expire_date`
- 画像: `event_image`
- 監査: `created_at`, `updated_at`

### 7.2 UserAccount / UserProfile
- `UserAccount`: 認証情報（email/password_hash/role）
- `UserProfile`: 表示情報（username/avatar_url）

## 8. 運用・テスト
- ローカルDB: `DATABASE_URL=file:/tmp/navios-dev.db`
- Prisma:
  - `npm run prisma:generate`
  - `npm run prisma:migrate`
  - `npm run prisma:seed`
- 品質確認:
  - `npm run lint`
  - `npm run build`
  - `npm run test`
- Supabase 接続リハーサルは成功済み（Phase1時点）

## 9. Phase2 へ持ち越し
- 管理画面（`/admin`）
- 収益化導線（広告/特集/優先掲載など）
- finished イベントの段階アーカイブ運用（自動ジョブ化）
- モバイル詳細体験の最終UX確定（BottomSheet再導入含む）
- ネイティブアプリ/チャット機能の検討

## 10. 非採用・撤回事項（Phase1）
- 地図のクラスタリング + スパイダー表示は、一部端末でポップアップ安定性課題があり Phase1 では非採用
