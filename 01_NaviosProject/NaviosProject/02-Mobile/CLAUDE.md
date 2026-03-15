# CLAUDE.md

NaviOs モバイルアプリのコーディングガイドラインおよびプロジェクト仕様。

---

## Project Overview

- **Name**: NaviOs — 地域情報共有アプリ
- **Stack**: Expo 55 + React Native 0.83 + TypeScript 5.9 + Expo Router
- **Backend**: Supabase (Auth, Postgres, PostGIS, Storage)
- **State Management**: Hooks + Supabase セッション（Redux/Context 不使用）

---

## Code Conventions

### ディレクトリ構成

| ディレクトリ | 責務 | ルール |
|---|---|---|
| `app/` | 画面・ルーティング | UI + インタラクション処理のみ。直接 Supabase を呼ばない |
| `components/` | 再利用 UI | API 呼び出し禁止。props で受け取り描画に専念 |
| `hooks/` | 横断状態・非同期取得 | 画面から呼ぶインターフェース。service を内部で使う |
| `lib/` | 外部サービス接続 | Supabase クエリ、認証、画像処理などの実装を集約 |
| `constants/` | 定数 | 色、カテゴリ、デザイントークン |
| `types/` | 型定義 | アプリ全体で共有する型 |
| `supabase/` | DB マイグレーション | SQL ファイルを `migrations/` に番号付きで管理 |
| `docs/` | ドキュメント | 仕様書、引き継ぎ、アプリ概要等 |

### 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントファイル | `PascalCase.tsx` | `PostCard.tsx`, `CreateStepBasic.tsx` |
| 非コンポーネントファイル | `camelCase.ts` | `postService.ts`, `useAuth.ts` |
| ドキュメントファイル | `kebab-case.md` + 番号接頭辞 | `01_system-handover-2026-03-15.md` |
| SQLマイグレーション | `NNN_kebab-case.sql` | `001_whispers.sql` |
| コンポーネント | `export default function PascalCase()` | default export 必須 |
| hooks | `use` プレフィックス | `useAuth`, `usePosts`, `useWhispers` |
| 定数 | `UPPER_SNAKE_CASE` | `CATEGORIES`, `REACTION_CONFIG` |
| 型 | `PascalCase` | `Post`, `Whisper`, `CategoryId` |
| 変数・関数 | `camelCase` | `handleSubmit`, `formatDistance` |
| スタイル | ファイル末尾に定義 | `const styles = StyleSheet.create({})` |

### ファイル整理方針

- **1ファイル500行以内を目標**。超える場合はサブコンポーネント分割を検討
- **分割基準**: ステップ単位（ウィザード）、ゾーン単位（距離ベースUI）、責務単位（表示/ロジック）
- **例外**: 画面内サブコンポーネントは同ファイル定義OK（`function StatItem()` 等）
- **同種ファイルが複数**: `01-99` の接頭辞で序列管理（`001_whispers.sql`）

### デザイントークン（`constants/design.ts`）

新しいスタイルを書くときは以下の値を優先的に使うこと:

```
FontSize:  xs(10) sm(12) md(14) lg(16) xl(20) xxl(24)
Spacing:   xs(4) sm(8) md(12) lg(16) xl(24) xxl(32)
Radius:    sm(8) md(12) lg(16) xl(24) full(9999)
Duration:  fast(200) normal(300) slow(500)
Shadow:    sm / md / lg プリセット
```

### カラー（`constants/colors.ts`）

- **ハードコード禁止**: 色は必ず `Colors.xxx` または `getCategoryInfo().color` を使う
- 各タブのテーマカラー:
  - Talk: `Colors.purple` (#8B5CF6)
  - Navios: `Colors.teal` (#0D9488)
  - Map: `Colors.primary` (#10B981)
  - Feed: `Colors.orange` (#E97316)
  - My: `Colors.primary` (#10B981)
- `rgba()` のみ例外的にインラインで許可

### コーディングスタイル

- **`Alert.alert` は操作系エラーのみ**使用。バリデーションはインラインエラー表示を優先
- **画像アップロード時は `optimizeImage()` を必ず使う**（投稿: 800px / アバター: 400px / quality: 0.7）
- **モックデータ**: `types/whisper.ts` にフォールバック用として残存。Supabase接続時は使わない
- **コメントは「なぜ」だけ書く**。「何をしているか」はコードで表現する
- **不要な import / 変数は即削除**。`_` prefix で残さない
- **認証ガード**: 未ログインでもタブ画面は閲覧可。投稿・Talk投稿・プロフィール編集はログイン必須

---

## Architecture (as of 2026-03-15)

### Routing

```
app/
├── _layout.tsx              # Root stack（未ログインでもタブ閲覧可）
├── (tabs)/
│   ├── _layout.tsx          # Tab bar: Talk | Navios | Map | Feed | My
│   ├── talk.tsx             # Talk（距離フェード型つぶやき）
│   ├── index.tsx            # Navios（AI検索, teal theme）
│   ├── nearby.tsx           # Map（フィード + 地図 + フローティングカード）
│   ├── search.tsx           # Feed（SectionList, orange theme）
│   └── profile.tsx          # My（ヒーローヘッダー + アバター + 2x2 stats）
├── post/
│   ├── [id].tsx             # Post detail + comments + like + manage
│   ├── create.tsx           # 3-step create form（分割済み）
│   └── success.tsx          # Post success
└── auth/
    ├── login.tsx            # Login (Japanese)
    └── register.tsx         # Register (Japanese)
```

### Data Layer

```
lib/
├── supabase.ts        # Client (AsyncStorage session)
├── auth.ts            # signIn / signUp / signOut
├── postService.ts     # Post CRUD + RPC + image upload + optimizeImage
├── whisperService.ts  # Whisper CRUD + RPC + reactions + replies
└── utils.ts           # formatDistance / calcMatchScore / getExpiryLabel
```

### Hooks

```
hooks/
├── useAuth.ts          # session / user / loading / error
├── usePosts.ts         # posts / loading / error / refetch
├── useNearbyPosts.ts   # RPC nearby + fallback
├── useLocation.ts      # coords / loading / error
└── useWhispers.ts      # whispers / loading / error / refetch
```

### Components

```
components/
├── common/
│   ├── UserAvatar.tsx        # URL画像 or イニシャル文字
│   ├── CategoryBadge.tsx     # カテゴリラベル
│   ├── CategoryFilter.tsx    # 横スクロールフィルターチップ
│   └── SkeletonLoader.tsx    # パルスアニメーション + プリセット
├── map/
│   └── MapView.tsx           # 地図表示（MapTiler対応予定）
└── post/
    ├── PostCard.tsx           # ホットカード (レスポンシブ幅)
    ├── PostListItem.tsx       # リスト行
    ├── CommentItem.tsx        # コメントバブル
    ├── CategoryDetailCard.tsx # カテゴリ別詳細表示
    ├── CreateStepBasic.tsx    # 投稿作成 Step 1: 基本情報
    ├── CreateStepDetails.tsx  # 投稿作成 Step 2: 詳細
    └── CreateStepConfirm.tsx  # 投稿作成 Step 3: 確認
```

### Categories

| ID | ラベル | カラー | アクション |
|---|---|---|---|
| `stock` | 物資 | #10B981 | 連絡する |
| `event` | イベント | #F59E0B | 参加する |
| `help` | 近助 | #F43F5E | 協力する |
| `admin` | 行政 | #8B5CF6 | 公式サイト |

---

## DB Expectations

### Tables

**投稿系**: `users`, `posts`, `post_details`, `comments`, `places`, `post_images`, `post_likes`

**Talk系**: `whispers`, `whisper_replies`, `whisper_reactions`

### Storage Buckets
- `images` — 投稿画像
- `avatars` — ユーザーアバター

### RPC
- `get_nearby_posts(user_lat, user_lng, radius_meters, category_filter)` — 近くの投稿
- `get_nearby_whispers(user_lat, user_lng, radius_meters)` — 近くのつぶやき（24h有効期限内）

### Required ENV
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_MAPTILER_API_KEY        # MapTiler（地図表示）
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY   # Google Places（場所検索）
```

---

## Feature Status

### 完了 (P0/P1)
- [x] Auth guard + Login / Register / Logout
- [x] 未ログインでもタブ閲覧可能（投稿・Talk投稿はログイン必須）
- [x] 全タブ Supabase 化（モックデータ依存ゼロ）
- [x] 投稿 CRUD（作成 3ステップ / 詳細表示 / 終了 / 削除）
- [x] 投稿作成画面の分割（796行 + 3サブコンポーネント）
- [x] コメント read/write + 自動ページネーション
- [x] いいね永続化（post_likes テーブル）
- [x] 画像アップロード + 最適化（投稿 / アバター）
- [x] Map: RPC + フローティングプレビューカード
- [x] Feed: セクション別表示（最新/盛り上がり/過去の人気）
- [x] My: ヒーローヘッダー + アバター編集 + ユーザー名編集 + 2x2 statsグリッド + FAB
- [x] Navios: AI検索（Question AI）
- [x] Talk: 距離フェード型つぶやき（Supabase backend + モックフォールバック）
- [x] スケルトンローダー / ハプティック / 認証画面日本語化 / デザイントークン統一

### 次の優先事項 (P2)
1. **MapTiler地図表示** — MapView.tsx をMapTilerベースに実装
2. **Google Places検索** — 投稿作成時の場所オートコンプリート
3. **実機回帰テスト** — 全画面の動作確認（iOS / Android）
4. **コメント楽観更新** — 送信後の即時反映改善
5. **プッシュ通知** — コメント・リアクション通知

### 既知の課題
- `app/(tabs)/profile.tsx` — 859行。将来的にサブコンポーネント分割を検討
- 地図はMapTiler（表示）+ Google Places（検索）で実装予定。現在の react-native-maps 実装は置き換え対象
- Talk の whispers は `auth.users` → `public.users` 間のFK制約なし。joinではなく別クエリで取得

---

## Dependencies to Install (if fresh clone)

```bash
npx expo install expo-haptics expo-image-manipulator expo-image-picker
```
