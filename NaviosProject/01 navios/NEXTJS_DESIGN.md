# Navios — Next.js 実装設計書

> **アプリ名**: Navios（ナビオス）
> **ドメイン**: navios.life
> **思想**: 自分の住んでいる場所でしっかりと生き抜ける安心を作る。あるいは旅先でその瞬間を発見することができる。「生活判断を支援する"ライフナビOS"」
> **モックアップ**: `claude.html`
> **目的**: HTMLモックアップをNext.js (App Router) でプロダクション実装するための設計ドキュメント

---
## 0. 現在の実装状態 (2026-02-14)

- `MapContainer -> MapInner` の `dynamic import (ssr:false)` 実装済み
- `Leaflet + react-leaflet` でマーカー/ポップアップ/スタイル切替を実装済み
- `app/page.tsx` はクライアントで `/api/events` をフェッチして描画
- `app/api/events/route.ts` は Prisma CRUD を実装（DB未接続時はモック返却）
- `store/useAppStore.ts` + `hooks/useEvents.ts` + `lib/event-status.ts` にロジック統一済み
- `app/new/page.tsx` は投稿フォームから `POST /api/events` 接続済み
- `app/event/[id]/page.tsx` は Prisma からイベント詳細表示（DB未接続時はモック）
- `app/api/events/[id]/route.ts` で `GET/PUT/DELETE` を実装済み
- `app/new/page.tsx` は `?id=` 指定時に編集モード（`PUT /api/events/[id]`）対応済み
- `app/event/[id]/page.tsx` から編集 (`/new?id=...`) / 削除 (`DELETE /api/events/[id]`) 導線を接続済み
- 主要UI画像は `next/image` へ置換済み（`unoptimized` 運用）
- ローカルDBは `.env` の `DATABASE_URL=file:/tmp/navios-dev.db` で固定
- Prisma 運用は `npm run prisma:migrate` (`db push`) + `npm run prisma:seed` で確定
- `GET/POST /api/events` は `zod` バリデーション導入済み
- `GET /api/geocode` はサーバーキャッシュ(TTL) + レート制限(1req/sec/IP) を実装済み
- APIレスポンスは `ok/data/error` 形式を共通化（互換キーも返却）
- `.env.production.example` と `README.md` を運用手順に合わせて整備済み
- `prisma/schema.supabase.prisma` と Supabase リハーサル用スクリプトを追加済み
- API・主要画面のテスト（Vitest）を追加済み

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
| DB | **SQLite(ローカル) / PostgreSQL(本番) + Prisma ORM (v6)** | 開発はローカル固定、本番はSupabaseへ移行可能 |
| 画像 | **Supabase Storage** or **Cloudinary** | event_image URL管理 |
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
│   │   └── page.tsx            ← 新規投稿ページ
│   └── api/
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
│   │   ├── MapStyleToggle.tsx  ← タイルレイヤー切替UI
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
│   └── ui/
│       ├── StatusBadge.tsx     ← TODAY / 開催予定 / 終了バッジ
│       ├── GlassCard.tsx       ← backdrop-blur glassmorphismカード
│       └── FilterTabs.tsx      ← all / today / upcoming / ended タブ
│
├── hooks/
│   ├── useEvents.ts            ← イベントデータ取得・フィルター
│   ├── useMapState.ts          ← マップのズーム・中心・スタイル状態
│   ├── useGeolocation.ts       ← 現在地取得
│   ├── useGeocode.ts           ← Nominatimジオコーディング (debounce付き)
│   └── useMediaQuery.ts        ← PC / Mobile判定
│
├── lib/
│   ├── prisma.ts               ← Prismaクライアントインスタンス
│   ├── event-status.ts         ← getEventStatus / formatDateRange / daysUntilText
│   └── constants.ts            ← STATUS_CONFIG, タイルURL等
│
├── store/
│   └── useAppStore.ts          ← Zustand: filter, selectedEvent, mapStyle
│
├── types/
│   └── event.ts                ← Event型定義
│
├── prisma/
│   ├── schema.prisma           ← DBスキーマ
│   ├── schema.supabase.prisma  ← Supabase切替リハーサル用スキーマ
│   └── seed.mjs                ← サンプルデータ投入

├── tests/
│   ├── api/                    ← Route Handler テスト
│   └── components/             ← 主要UIコンポーネントテスト
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
│ (PC only)│    ├── EventMarker × N           │
│          │    ├── MapStyleToggle (PC)        │
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
| `.marker-pin.pin-today/upcoming/ended` | `EventMarker.tsx` | Client | 時間軸に応じたアイコン・アニメーション切替 |
| PC map overlays | `MapStats.tsx` + `MapStyleToggle.tsx` | Client | フロートUI |
| `.bottom-sheet` | `BottomSheet.tsx` | Client | framer-motionでアニメーション推奨 |
| `.menu-drawer` | `MenuDrawer.tsx` | Client | フィルター+スタイル切替 |
| `.search-results` | `SearchResults.tsx` | Client | Nominatimサジェスト |
| `.post-card` | `EventCard.tsx` | Client | 時間軸ボーダー+バッジ |
| `.status-badge` | `StatusBadge.tsx` | Server | TODAY/開催予定/終了の表示分け |

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
  id           String   @id @default(cuid())
  title        String
  content      String
  latitude     Float
  longitude    Float
  event_date   DateTime
  expire_date  DateTime
  event_image  String
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
}
```

### TypeScript型

```ts
// types/event.ts
export interface Event {
  id: string;
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  event_date: string;   // 'YYYY-MM-DD'
  expire_date: string;  // 'YYYY-MM-DD'
  event_image: string;  // URL
}

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
  mapStyle: 'voyager' | 'light' | 'dark';
  isMenuOpen: boolean;
  isBottomSheetOpen: boolean;

  setFilter: (f: AppState['filter']) => void;
  setSearchQuery: (q: string) => void;
  selectEvent: (id: string | null) => void;
  setMapStyle: (s: AppState['mapStyle']) => void;
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
  "latitude": 31.573,
  "longitude": 130.345,
  "event_date": "2026-03-01",
  "expire_date": "2026-03-01",
  "event_image": "https://..."
}
```

- **実装状況**: バリデーション後に Prisma `event.create` で保存
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `event` も返却

### `GET /api/events/[id]`

- **実装状況**: Prisma `findUnique` で単一イベントを返却
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `event` も返却

### `PUT /api/events/[id]`

- **実装状況**: `zod` バリデーション後に Prisma `event.update`
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `event` も返却

### `DELETE /api/events/[id]`

- **実装状況**: Prisma `event.delete` で削除し、削除IDを返却
- **レスポンス形式**: `ok/data/error`

### `GET /event/[id]` (画面)

- **実装状況**: `app/event/[id]/page.tsx` で Prisma `findUnique` により詳細表示
- **フォールバック**: DB未接続時は `lib/mock-events.ts` から表示

### `GET /api/geocode?q=鹿児島市`

Nominatimへのプロキシ (レート制限: 1req/sec を考慮したサーバーサイドキャッシュ)

- **実装状況**: メモリキャッシュ(TTL 5分) + 1req/sec/IP の制限を追加済み
- **レスポンス形式**: `ok/data/error` を基本とし、互換のため `results` も返却

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
| 9 | **Server Actions** | 投稿フォーム実装 |
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
- `vitest` で API (`/api/events`, `/api/events/[id]`) のテストを追加
- `@testing-library/react` で `EventDetail` / `EventActions` の表示・操作テストを追加

### 時間軸ピン
- `getEventStatus()` の結果に応じてCSSクラスを動的に切り替え
- `zIndexOffset` で TODAY イベントを最前面に表示（モックアップと同じ）

### パフォーマンス
- イベント一覧は `React.memo` + `useCallback` でリレンダー最適化
- 大量ピン対応が必要なら `react-leaflet-cluster` (MarkerCluster) を導入
