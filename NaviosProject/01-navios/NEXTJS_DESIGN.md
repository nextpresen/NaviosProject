# Navios — Next.js 実装設計書

> **アプリ名**: Navios（ナビオス）
> **ドメイン**: navios.life
> **思想**: 自分の住んでいる場所でしっかりと生き抜ける安心を作る。あるいは旅先でその瞬間を発見することができる。「生活判断を支援する"ライフナビOS"」
> **モックアップ**: `claude.html`
> **目的**: HTMLモックアップをNext.js (App Router) でプロダクション実装するための設計ドキュメント

---
## 0. 現在の実装状態 (2026-02-15)

- `MapContainer -> MapInner` の `dynamic import (ssr:false)` 実装済み
- `Leaflet + react-leaflet` でマーカー/ポップアップを実装済み（タイルは standard 固定）
- `app/page.tsx` はクライアントで `/api/events` をフェッチして描画
- `app/api/events/route.ts` は Prisma CRUD を実装（DB未接続時はモック返却）
- `store/useAppStore.ts` + `hooks/useEvents.ts` + `lib/event-status.ts` にロジック統一済み
- `app/new/page.tsx` は投稿フォームから `POST /api/events` 接続済み
- `app/new/page.tsx` は画像アップロード入力に対応（`event_image` は data URL で送信）
- `app/new/page.tsx` はカテゴリ選択に対応（祭り / グルメ / 自然 / 文化 / その他）
- `app/new/page.tsx` は未ログイン時にフォーム非表示とし「ログインが必要です」メッセージを表示
- モバイルのイベント選択時 BottomSheet は一旦非表示（UI調整のため停止）
- `app/new/page.tsx` に場所選択ミニマップを追加し、地図操作と緯度経度入力を双方向同期
- `app/new/page.tsx` に住所候補検索（geocode）を追加し、候補選択で地図/座標を自動反映
- 投稿画像はフロントで 3:2 中央トリミング + 1200x800 最適化 + 品質0.8 圧縮（2MB超過時は警告表示）
- 投稿フォームに位置選択ミニマップを追加（中央固定ピン推奨 + タップ配置 + ピンドラッグ対応）
- 投稿フォームに住所候補検索を追加し、候補選択でミニマップ/緯度経度を自動反映。緯度経度手入力は上級者向け折りたたみへ整理
- `app/me/page.tsx` を追加し、ログインインジケーター画面（ユーザーアイコン + ユーザー名編集 + アイコン画像更新）を実装
- `/api/auth/profile` で `avatar_url` を保存し、投稿作成時の `author_avatar_url` に反映
- `/api/auth/profile` 更新時に既存投稿の `author_avatar_url` も同期更新し、ピン画像を即時反映
- マップピンは「中央:投稿者アイコン + 左:カテゴリチップ」の複合表示に対応（白背景+グラデ枠、アニメーションは選択中のみ）
- `LIVE NOW` 配色をピンクグラデーション系へ統一（LIVE NOWピン/バッジ/統計表示）
- 初期フィルタを `LIVE NOW`（today）に変更し、トップ初期表示で当日イベントを優先
- サイドバーの `all` 表示では `SOON` / `FINISHED` を折りたたみ表示にして情報密度を抑制
- 一覧カード/地図ピンの非`LIVE NOW`要素は透明度を下げ、視線が当日投稿へ集まるように調整
- 投稿フォームの日付入力に「今日開催にする」クイック設定を追加（開始日/終了日を同時に当日へ）
- `SOON` のステータスアイコンは日付アイコンと混同しないよう `⭐` へ変更
- マップ中心座標の通知は同値抑制を追加し、`Maximum update depth exceeded` ループを解消
- MapStats の表示ラベルを `ALL / LIVE NOW / SOON` に統一
- PCフィルタータブの `LIVE NOW` アクティブ状態をピンクグラデーション表示に変更
- 画像表示は見切れ防止のため主要画面で `object-contain` + 背景色表示へ調整
- ヘッダー左上ロゴを `public/navios-logo.svg` に差し替え済み（PC/モバイル共通）
- `app/event/[id]/page.tsx` は Prisma からイベント詳細表示（DB未接続時はモック）
- `app/api/events/[id]/route.ts` で `GET/PUT/DELETE` を実装済み
- `app/new/page.tsx` は `?id=` 指定時に編集モード（`PUT /api/events/[id]`）対応済み
- `app/event/[id]/page.tsx` から編集 (`/new?id=...`) / 削除 (`DELETE /api/events/[id]`) 導線を接続済み
- 詳細画面の編集/削除導線は owner のみ表示（非ownerは案内文表示）
- `Event.author_id` を追加し、`PUT/DELETE /api/events/[id]` に owner/admin 認可を導入済み
- Auth.js (Credentials) を導入し、ログインUIは `signIn("credentials")` に移行済み
- API認証は Auth.js セッション + 旧Cookie の併用で段階移行中
- `author_id = session.user.id` で統一
- `/signup` + `POST /api/auth/register` による新規ユーザー登録を実装済み
- `UserAccount` モデル追加（email unique + password_hash + role）
- 非権限時のUI/APIメッセージを日本語で統一済み（未ログイン/権限不足）
- 主要UI画像は `next/image` へ置換済み（`unoptimized` 運用）
- ローカルDBは `.env` の `DATABASE_URL=file:/tmp/navios-dev.db` で固定
- Prisma 運用は `npm run prisma:migrate` (`db push`) + `npm run prisma:seed` で確定
- `GET/POST /api/events` は `zod` バリデーション導入済み
- `GET /api/geocode` はサーバーキャッシュ(TTL) + レート制限(1req/sec/IP) を実装済み
- 地図ヘッダーの「表示エリア」は reverse geocode で動的更新（市区町村優先→都道府県フォールバック→◯◯周辺）
- APIレスポンスは `ok/data/error` 形式を共通化（互換キーも返却）
- `.env.production.example` と `README.md` を運用手順に合わせて整備済み
- `prisma/schema.supabase.prisma` と Supabase リハーサル用スクリプトを追加済み
- 依存追加なしの E2E相当テスト（`npm run test`）を追加済み
- Supabase リハーサル成功済み（`Supabase CRUD rehearsal passed`）
- Supabase リハーサル再成功（2026-02-15, `createdId: cmlmn2xfm0000bt7qkz7dkfp1`）
- 管理画面（`/admin`）は Phase 2 実装予定

---

## 1. 技術スタック

| 領域 | 技術 | 理由 |
|---|---|---|
| フレームワーク | **Next.js 16 (App Router)** | App Router + Turbopack で開発/ビルド高速化 |
| スタイリング | **Tailwind CSS** | モックアップとの一貫性 |
| 地図 | **react-leaflet** | Leafletのreactラッパー、SSR対応は `dynamic import` |
| タイルサーバー | **CARTO / OpenStreetMap** | 無料・商用利用可 |
| 状態管理 | **Zustand** | 軽量、イベントフィルター・マップ状態管理用 |
| データ取得 | **Client Fetch + Route Handlers + Prisma** | `GET/POST /api/events` で Event CRUD |
| 認証 | **Auth.js (Credentials)** | セッション管理を標準化し、owner/admin認可へ連携 |
| DB | **SQLite(ローカル) / PostgreSQL(本番) + Prisma ORM (v6)** | 開発はローカル固定、本番はSupabaseへ移行可能 |
| 画像 | **一時: data URLアップロード / 将来: Supabase Storage** | 現状はフォームアップロードを `event_image` に保持 |
| ジオコーディング | **Nominatim API** (OSM) | 地名検索 |
| フォント | **Inter** (next/font) | モックアップと同一 |

---

## 2. 推奨フォルダ構成

```
navios/
├── app/
│   ├── globals.css             ← グローバルスタイル
│   ├── favicon.ico             ← アプリアイコン
│   ├── layout.tsx              ← ルートレイアウト (フォント, メタ, Providers)
│   ├── page.tsx                ← トップページ (マップ画面)
│   ├── event/
│   │   └── [id]/
│   │       └── page.tsx        ← イベント詳細ページ
│   ├── new/
│   │   └── page.tsx            ← 投稿するページ
│   ├── signup/
│   │   └── page.tsx            ← 新規ユーザー登録ページ
│   ├── me/
│   │   └── page.tsx            ← ログインインジケーター画面
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts ← Auth.js handler
│       │   ├── register/route.ts ← POST: 新規登録
│       │   ├── login/route.ts ← POST: ログイン
│       │   ├── logout/route.ts← POST: ログアウト
│       │   ├── session/route.ts← GET: セッション確認
│       │   └── profile/route.ts← GET/PATCH: ユーザー名取得/更新
│       ├── events/
│       │   ├── route.ts        ← GET: 一覧 / POST: 新規作成
│       │   └── [id]/
│       │       └── route.ts    ← GET: 詳細 / PUT: 更新 / DELETE: 削除
│       └── geocode/
│           └── route.ts        ← Nominatim プロキシ (レート制限対策)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx          ← PC用ヘッダー
│   │   ├── MobileHeader.tsx    ← モバイル用ヘッダー (検索 + ハンバーガー)
│   │   └── Sidebar.tsx         ← PC用サイドバー (検索 + フィルター + リスト)
│   │
│   ├── map/
│   │   ├── MapContainer.tsx    ← Leafletマップ本体 (dynamic import, ssr:false)
│   │   ├── EventMarker.tsx     ← 時間軸ピン (today / upcoming / ended)
│   │   ├── MarkerIcon.tsx      ← L.divIcon生成ロジック
│   │   ├── MapStats.tsx        ← PC用フロート統計
│   │   └── MapControls.tsx     ← 現在地・全体表示ボタン
│   │
│   ├── event/
│   │   ├── EventCard.tsx       ← サイドバー用カード (時間軸ボーダー付き)
│   │   ├── EventPopup.tsx      ← PC用Leafletポップアップ中身
│   │   ├── EventDetail.tsx     ← 詳細ページ本文
│   │   └── EventActions.tsx    ← 詳細ページの編集/削除導線
│   │
│   ├── mobile/
│   │   ├── BottomSheet.tsx     ← モバイル用ボトムシート
│   │   ├── MenuDrawer.tsx      ← ハンバーガーメニュードロワー
│   │   └── SpotBadge.tsx       ← マップ上のイベント数バッジ
│   │
│   ├── search/
│   │   ├── SearchInput.tsx     ← 検索入力 (共通)
│   │   └── SearchResults.tsx   ← Nominatimサジェスト表示
│   │
│   ├── ui/
│   │   ├── StatusBadge.tsx     ← LIVE NOW / SOON / FINISHED バッジ
│   │   ├── GlassCard.tsx       ← backdrop-blur glassmorphismカード
│   │   └── FilterTabs.tsx      ← all / today / upcoming / ended タブ
│   └── providers/
│       └── AuthSessionProvider.tsx ← SessionProvider ラッパー
│
├── hooks/
│   ├── useEvents.ts            ← イベントデータ取得・フィルター
│   ├── useGeolocation.ts       ← 現在地取得
│   ├── useGeocode.ts           ← Nominatimジオコーディング (debounce付き)
│   └── useMediaQuery.ts        ← PC / Mobile判定
│
├── lib/
│   ├── prisma.ts               ← Prismaクライアントインスタンス
│   ├── event-status.ts         ← getEventStatus / formatDateRange / daysUntilText
│   ├── authz.ts                ← actor解決・owner/admin認可判定
│   ├── auth-options.ts         ← Auth.js 設定 (Credentials)
│   ├── auth-session.ts         ← actor解決 (Auth.js + 旧Cookie互換)
│   └── constants.ts            ← STATUS_CONFIG, タイルURL等
│
├── store/
│   └── useAppStore.ts          ← Zustand: filter, selectedEvent, UI state
│
├── types/
│   ├── event.ts                ← Event型定義
│   └── next-auth.d.ts          ← Auth.js型拡張
│
├── prisma/
│   ├── schema.prisma           ← DBスキーマ
│   ├── schema.supabase.prisma  ← Supabase切替リハーサル用スキーマ
│   └── seed.mjs                ← サンプルデータ投入

├── scripts/
│   ├── run-tests.sh            ← Prisma生成 + APIフローテスト実行
│   ├── test-api-flow.mjs       ← new編集フロー相当を含む CRUD シナリオ
│   ├── supabase-rehearsal.sh   ← Supabase接続リハーサル実行
│   └── supabase-crud-check.mjs ← Supabase CRUD 実地確認
│
├── public/
│   └── (静的アセット)
│
├── eslint.config.mjs
├── postcss.config.mjs
├── next-env.d.ts
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package-lock.json
└── package.json
```

---

## 3. コンポーネント分割の詳細

### 3-1. `app/page.tsx` (トップページ)

```
┌─────────────────────────────────────────────┐
│ Header (PC) / MobileHeader (SP)             │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  MapContainer                    │
│ (PC only)│    ├── MarkerIcon × N            │
│          │    ├── MapStats (PC)              │
│          │    ├── MapControls               │
│          │    └── SpotBadge (SP)            │
├──────────┴──────────────────────────────────┤
│ BottomSheet (SP only, 条件表示)              │
│ MenuDrawer (SP only, 条件表示)               │
└─────────────────────────────────────────────┘
```

- **現状**: `page.tsx` は `"use client"` で `/api/events` を取得し、`useAppStore/useEvents` で状態管理
- **Client Component**: `MapContainer`, `MapInner`, `BottomSheet`, `MenuDrawer`, `SearchInput` は `"use client"`

### 3-2. コンポーネント対応表 (HTML → React)

| モックアップの要素 | Reactコンポーネント | 種別 | 説明 |
|---|---|---|---|
| `<header class="pc-header">` | `Header.tsx` | Server | PC用ヘッダー、ロゴ+投稿ボタン |
| `<header class="mobile-header">` | `MobileHeader.tsx` | Client | 検索+ハンバーガー、レスポンシブで出し分け |
| `<aside class="pc-sidebar">` | `Sidebar.tsx` | Client | 検索+フィルタータブ+EventCard一覧 |
| `<div id="map">` | `MapContainer.tsx` | Client | **dynamic import必須** (Leafletはブラウザ専用) |
| `.marker-pin.pin-today/upcoming/ended` | `MarkerIcon.tsx` | Client | 時間軸 + カテゴリ + 投稿者アイコンの合成 |
| PC map overlays | `MapStats.tsx` | Client | フロートUI |
| `.bottom-sheet` | `BottomSheet.tsx` | Client | framer-motionでアニメーション推奨 |
| `.menu-drawer` | `MenuDrawer.tsx` | Client | フィルター+投稿/ログイン導線 |
| `.search-results` | `SearchResults.tsx` | Client | Nominatimサジェスト |
| `.post-card` | `EventCard.tsx` | Client | 時間軸ボーダー+バッジ |
| `.status-badge` | `StatusBadge.tsx` | Server | LIVE NOW/SOON/FINISHED の表示分け |
| 詳細画面の編集/削除導線 | `EventActions.tsx` | Client | owner 判定で表示制御 |

### 3-3. Leaflet の SSR 対策

```tsx
// components/map/MapContainer.tsx
"use client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./MapInner"), { ssr: false });

export function MapContainer({ events }) {
  return <Map events={events} />;
}
```

---

## 4. データモデル (Prisma)

```prisma
model Event {
  id                String   @id @default(cuid())
  title             String
  content           String
  author_id         String?
  author_avatar_url String?
  category          String   @default("other")
  latitude          Float
  longitude         Float
  event_date        DateTime
  expire_date       DateTime
  event_image       String
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}

model UserProfile {
  user_id    String   @id
  username   String
  avatar_url String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

model UserAccount {
  id            String   @id @default(cuid())
  email         String   @unique
  password_hash String
  role          String   @default("user")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}
```

### TypeScript型

```ts
// types/event.ts
export interface Event {
  id: string;
  title: string;
  content: string;
  author_id?: string | null;
  author_avatar_url?: string | null;
  category: 'festival' | 'gourmet' | 'nature' | 'culture' | 'other';
  latitude: number;
  longitude: number;
  event_date: string;   // 'YYYY-MM-DD'
  expire_date: string;  // 'YYYY-MM-DD'
  event_image: string;  // https URL or data:image/...;base64,...
}

export type EventCategory = 'festival' | 'gourmet' | 'nature' | 'culture' | 'other';
export type EventStatus = 'today' | 'upcoming' | 'ended';
```

---

## 5. 時間軸ステータスロジック (`lib/event-status.ts`)

モックアップのJSロジックをそのまま切り出す:

```ts
export function getEventStatus(event: Event): EventStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (event.event_date <= today && event.expire_date >= today) return 'today';
  if (event.event_date > today) return 'upcoming';
  return 'ended';
}

export function daysUntilText(event: Event): string {
  const today = new Date().toISOString().slice(0, 10);
  const status = getEventStatus(event);
  if (status === 'today') return '開催中';
  if (status === 'upcoming') {
    const diff = Math.ceil(
      (new Date(event.event_date).getTime() - new Date(today).getTime()) / 86400000
    );
    return `あと${diff}日`;
  }
  const diff = Math.ceil(
    (new Date(today).getTime() - new Date(event.expire_date).getTime()) / 86400000
  );
  return `${diff}日前に終了`;
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return start === end
    ? fmt(new Date(start))
    : `${fmt(new Date(start))} 〜 ${fmt(new Date(end))}`;
}
```

---

## 6. Zustand ストア (`store/useAppStore.ts`)

```ts
interface AppState {
  filter: 'all' | 'today' | 'upcoming' | 'ended';
  searchQuery: string;
  selectedEventId: string | null;
  isMenuOpen: boolean;
  isBottomSheetOpen: boolean;

  setFilter: (f: AppState['filter']) => void;
  setSearchQuery: (q: string) => void;
  selectEvent: (id: string | null) => void;
  toggleMenu: () => void;
  setBottomSheet: (open: boolean) => void;
}
```

---

## 7. API設計

### `GET /api/events`

```
?status=today|upcoming|ended  (optional)
?q=検索文字列                   (optional)
?lat=31.57&lng=130.34&radius=10 (optional, km)
```

- **実装状況**: Prisma で `Event` 一覧取得後、status / q / 半径条件でフィルター
- **フォールバック**: DB未接続時は `lib/mock-events.ts` を返却
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `events` も返却

### `POST /api/events`

```json
{
  "title": "イベント名",
  "content": "本文",
  "category": "festival|gourmet|nature|culture|other",
  "author_avatar_url": "https://... (optional)",
  "latitude": 31.573,
  "longitude": 130.345,
  "event_date": "2026-03-01",
  "expire_date": "2026-03-01",
  "event_image": "https://... or data:image/...;base64,..."
}
```

- **実装状況**: バリデーション後に Prisma `event.create` で保存（`event_image` は `https URL` / `data:image` 両対応）
- **author_id**: ログインセッションの `userId` を保存（未ログインは `401`）
- **author_avatar_url**: 省略時はログインユーザー情報から自動生成
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `event` も返却

### `GET /api/events/[id]`

- **実装状況**: Prisma `findUnique` で単一イベントを返却
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `event` も返却

### `PUT /api/events/[id]`

- **実装状況**: `zod` バリデーション後に Prisma `event.update`
- **認可**: owner または admin のみ更新可（未ログイン `401`、権限なし `403`）
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `event` も返却

### `DELETE /api/events/[id]`

- **実装状況**: Prisma `event.delete` で削除し、削除IDを返却
- **認可**: owner または admin のみ削除可（未ログイン `401`、権限なし `403`）
- **レスポンス形式**: `ok/data/error`

### `GET /event/[id]` (画面)

- **実装状況**: `app/event/[id]/page.tsx` で Prisma `findUnique` により詳細表示
- **フォールバック**: DB未接続時は `lib/mock-events.ts` から表示

### `GET /api/geocode?q=鹿児島市`

Nominatimへのプロキシ (レート制限: 1req/sec を考慮したサーバーサイドキャッシュ)

- **実装状況**: メモリキャッシュ(TTL 5分) + 1req/sec/IP の制限を追加済み
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `results` も返却

### `POST /api/auth/login`

- **実装状況**: 互換用として email/password でログインし、署名付きCookieを発行（テスト/段階移行用）

### `POST /api/auth/register`

- **実装状況**: email/password(+任意username)で新規登録
- **永続化**: `UserAccount` に password hash を保存し、`UserProfile` に username を保存
- **重複制御**: 既存メールは `409 CONFLICT`

### `GET/POST /api/auth/[...nextauth]`

- **実装状況**: Auth.js Credentials Provider で本セッション運用
- **ログインUI**: `/login` から `signIn("credentials")` を使用

### `POST /api/auth/logout`

- **実装状況**: 互換Cookieを削除（Auth.js セッションは `signOut()` で破棄）

### `GET /api/auth/session`

- **実装状況**: 現在ログイン中の actor 情報を返却（Auth.js + 互換Cookie両対応）

### `GET/PATCH /api/auth/profile`

- **実装状況**: ログインユーザーのプロフィール（表示名 + アイコン）を取得/更新（Auth.js + 互換Cookie両対応）
- **更新対象**: `username`, `avatar_url`（email はログインIDとして固定）

---

## 8. 実装ステップ (推奨順序)

| # | ステップ | 内容 |
|---|---|---|
| 1 | **プロジェクト初期化** | `npx create-next-app@latest navios --ts --tailwind --app` |
| 2 | **型定義 + ユーティリティ** | `types/event.ts`, `lib/event-status.ts`, `lib/constants.ts` |
| 3 | **UIコンポーネント (地図なし)** | `StatusBadge`, `GlassCard`, `FilterTabs`, `EventCard` |
| 4 | **レイアウト** | `Header`, `MobileHeader`, `Sidebar` |
| 5 | **地図コンポーネント** | `MapContainer` (dynamic import), `EventMarker`, `MarkerIcon` |
| 6 | **インタラクション** | `BottomSheet`, `MenuDrawer`, `SearchInput/Results` |
| 7 | **Zustand統合** | ストア作成、全コンポーネント接続 |
| 8 | **DB + API** | Prismaセットアップ、`/api/events`, `/api/geocode` |
| 9 | **投稿フォーム連携** | `app/new/page.tsx` から `/api/events` 連携 |
| 10 | **デプロイ** | Vercel + Supabase |

---

## 9. ポイント・注意事項

### Leaflet + Next.js
- `"use client"` + `dynamic(() => import(...), { ssr: false })` が必須
- Leaflet CSSは `app/layout.tsx` で `<link>` か `import` で読み込む
- `L.divIcon` のHTMLはReactの仮想DOMと独立するため、マーカーアイコンはHTML文字列で渡す（モックと同じ方式）

### レスポンシブ制御
- `useMediaQuery` フックで判定し、PC用/SP用コンポーネントを出し分け
- Tailwindの `lg:hidden` / `lg:block` でのCSS切替も併用

### テスト
- `npm run test` は `scripts/run-tests.sh` 経由で `prisma generate` 後に `scripts/test-api-flow.mjs` を実行
- 検証対象: 一覧取得・新規作成・非owner更新(`403`)・更新バリデーション異常・更新成功・詳細確認・削除・削除後404

### 本番チェック
- `docs.production-checklist.md` を追加し、環境変数・DB・監視項目をチェックリスト化
- 認証/認可の設計ドラフトは `docs.authz-spec.md` に整理

### 時間軸ピン
- `getEventStatus()` の結果に応じてCSSクラスを動的に切り替え
- `zIndexOffset` で LIVE NOW イベントを最前面に表示（モックアップと同じ）
- 中央は投稿者アイコン、左上はカテゴリチップ（絵文字 + 色）で表示
- 大ピンは白背景 + ステータスごとのグラデーション枠
- ピンのアニメーションは選択中イベントに限定して表示

### パフォーマンス
- イベント一覧は `React.memo` + `useCallback` でリレンダー最適化
- 大量ピン対応が必要なら `react-leaflet-cluster` (MarkerCluster) を導入
