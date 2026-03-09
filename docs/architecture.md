# NaviOs アーキテクチャ・ディレクトリ構成

> 最終更新: 2026-03-09

---

## ディレクトリ構成（現状）

```
Mobile/
├── .env                          # 環境変数（Supabase URL / Key / MapTiler Key）
├── .gitignore
├── app.json                      # Expo 設定
├── package.json                  # 依存パッケージ定義
├── tsconfig.json                 # TypeScript 設定
├── mock.jsx                      # Web プロトタイプ（UI参照用・実行には使わない）
│
├── app/                          # Expo Router（ファイルベースルーティング）
│   ├── _layout.tsx               # RootLayout + AuthGuard（Stack ナビゲーター）
│   ├── (tabs)/                   # ボトムタブグループ
│   │   ├── _layout.tsx           # TabsLayout（カスタムタブバー + 中央投稿ボタン）
│   │   ├── index.tsx             # Pulse画面（ホーム・投稿フィード）
│   │   ├── nearby.tsx            # 近く画面（地図プレースホルダー）
│   │   ├── search.tsx            # 検索画面
│   │   └── profile.tsx           # マイページ
│   ├── post/
│   │   ├── create.tsx            # 投稿作成（モーダル）
│   │   └── [id].tsx              # 投稿詳細（スライドイン）
│   └── auth/
│       ├── login.tsx             # ログイン
│       └── register.tsx          # 新規登録
│
├── components/                   # 再利用コンポーネント
│   ├── common/                   # 汎用UI部品
│   │   ├── CategoryBadge.tsx     # カテゴリバッジ表示
│   │   ├── CategoryFilter.tsx    # カテゴリフィルターバー
│   │   ├── DatePickerField.tsx   # 日付選択フィールド
│   │   └── UserAvatar.tsx        # ユーザーアバター
│   ├── nearby/
│   │   └── NearbyStyles.ts       # 近く画面スタイル定義
│   ├── post/                     # 投稿関連コンポーネント
│   │   ├── PostCard.tsx          # 投稿カード（フィード用）
│   │   ├── PostListItem.tsx      # 投稿リストアイテム
│   │   ├── CommentItem.tsx       # コメント表示
│   │   ├── CategoryDetailCard.tsx # カテゴリ別詳細カード
│   │   ├── CategoryFields.tsx    # カテゴリ別入力フィールド切替
│   │   ├── CreatePostHeader.tsx  # 投稿作成ヘッダー
│   │   ├── PostDetailStyles.ts   # 投稿詳細スタイル定義
│   │   ├── PostFormStyles.ts     # 投稿フォームスタイル定義
│   │   └── fields/               # カテゴリ別入力フィールド
│   │       ├── AdminFields.tsx   # 行政カテゴリ固有フィールド
│   │       ├── EventFields.tsx   # イベントカテゴリ固有フィールド
│   │       ├── HelpFields.tsx    # 近助カテゴリ固有フィールド
│   │       └── StockFields.tsx   # 物資カテゴリ固有フィールド
│   ├── profile/                  # プロフィール関連コンポーネント
│   │   ├── ProfileCard.tsx       # プロフィールカード
│   │   └── MyPostsCard.tsx       # 自分の投稿一覧カード
│   └── pulse/
│       └── PulseStyles.ts        # Pulse画面スタイル定義
│
├── hooks/                        # カスタムフック
│   ├── useAuth.ts                # 認証セッション管理
│   ├── useLocation.ts            # GPS 座標取得（開発用フォールバック付き）
│   ├── usePosts.ts               # 近隣投稿一覧取得（PostGIS RPC）
│   ├── usePost.ts                # 単一投稿取得
│   ├── useProfile.ts             # ログインユーザープロフィール + 統計
│   └── useMyPosts.ts             # ログインユーザーの投稿一覧
│
├── lib/                          # ユーティリティ・API層
│   ├── supabase.ts               # Supabase クライアント初期化
│   ├── auth.ts                   # 認証関数（signIn / signUp / signOut）
│   ├── postsApi.ts               # 投稿 CRUD（fetch / create / 画像アップロード）
│   ├── utils.ts                  # ユーティリティ関数
│   └── mockData.ts               # モックデータ（フォールバック用）
│
├── types/
│   └── index.ts                  # 共有型定義（User / Post / Place / Comment 等）
│
├── constants/
│   ├── categories.ts             # カテゴリ定義（4種 + ヘルパー関数）
│   └── colors.ts                 # カラー定数
│
├── assets/                       # 画像・フォント等の静的リソース
│
└── docs/                         # 設計ドキュメント
    ├── requirements.md           # 要件定義書
    ├── progress.md               # 実装進捗
    ├── changelog.md              # 変更履歴
    └── architecture.md           # 本ドキュメント
```

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Expo (React Native) | SDK 55 |
| 言語 | TypeScript | 5.9 |
| ルーティング | Expo Router | 55.x |
| ナビゲーション | React Navigation (Bottom Tabs) | 7.x |
| UI | React Native + StyleSheet.create | - |
| アイコン | @expo/vector-icons (Ionicons) | 15.x |
| データベース | Supabase (PostgreSQL + PostGIS) | 2.98+ |
| 認証 | Supabase Auth (JWT) | - |
| ストレージ | Supabase Storage（画像） | - |
| セッション永続化 | AsyncStorage | 2.2 |
| 位置情報 | expo-location | 55.x |
| カメラ/ギャラリー | expo-image-picker | 55.x |
| 日付選択 | @react-native-community/datetimepicker | 8.6 |
| 地図（予定） | MapLibre GL + MapTiler | 未導入 |

---

## アーキテクチャ全体図

```
┌─────────────────────────────────────────────────────────┐
│                    Expo Router (Stack)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │              RootLayout (_layout.tsx)              │  │
│  │  ┌─ AuthGuard ─────────────────────────────────┐  │  │
│  │  │  session あり + auth画面 → /(tabs) redirect │  │  │
│  │  │  session なし → 閲覧は許可                   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌─ (tabs) ─────────────────────────────────────┐ │  │
│  │  │  Pulse | 近く | [投稿+] | 検索 | マイページ  │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │  ┌─ post/[id] ──┐  ┌─ post/create ────────────┐  │  │
│  │  │ 投稿詳細     │  │ 投稿作成（モーダル）     │  │  │
│  │  └──────────────┘  └──────────────────────────┘  │  │
│  │  ┌─ auth/ ──────────────────────────────────────┐ │  │
│  │  │  login | register                            │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## データフロー

### 投稿取得フロー

```
useLocation()
  │  expo-location で GPS 座標取得
  │  GPS 不可 + __DEV__ → 伊集院町フォールバック座標
  ▼
usePosts(coords)
  │  coords null → MOCK_POSTS（即時返却）
  │  coords あり → fetchNearbyPosts()
  ▼
fetchNearbyPosts(lat, lng, 1000m)
  │  Step 1: get_nearby_posts RPC (PostGIS ST_DWithin)
  │           → { id, distance_meters }[]
  │  Step 2: posts.select(JOIN users, places, post_details,
  │           post_images, comments(count)).in('id', ids)
  │  Step 3: mapDbPostToPost() で DbPost → Post 変換
  ▼
Post[] （距離順ソート済み）
```

### 投稿作成フロー

```
PostCreateScreen (form入力)
  ▼
createPost(form, authorId)
  │  1. places INSERT（新規場所の場合のみ）
  │  2. posts INSERT（PostGIS POINT カラムに座標保存）
  │  3. post_details INSERT（カテゴリ別詳細）
  │  4. 画像あり → Storage upload → post_images INSERT
  ▼
postId 返却 → 画面遷移
```

### 認証フロー

```
Supabase Auth (JWT)
  │
  ├── signIn()  → supabase.auth.signInWithPassword()
  ├── signUp()  → supabase.auth.signUp() + display_name メタデータ
  └── signOut() → supabase.auth.signOut()
  │
  ▼
useAuth() フック
  │  supabase.auth.getSession() で初期セッション取得
  │  onAuthStateChange() でリアルタイム監視
  │  AsyncStorage でセッション永続化
  ▼
AuthGuard (_layout.tsx)
  │  session あり + auth 画面 → /(tabs) へリダイレクト
  │  session なし → 閲覧は許可
  ▼
requireAuth() (タブバー)
  │  投稿ボタン押下時: session なし → /auth/login へ遷移
```

---

## 画面ルーティング一覧

| 画面 | パス | 遷移方法 | 認証要否 |
|------|------|----------|---------|
| Pulse（ホーム） | `/(tabs)/` | タブ | 不要（閲覧可） |
| 近く（地図） | `/(tabs)/nearby` | タブ | 不要（閲覧可） |
| 検索 | `/(tabs)/search` | タブ | 不要（閲覧可） |
| マイページ | `/(tabs)/profile` | タブ | 不要（未ログイン時は誘導UI） |
| 投稿作成 | `/post/create` | モーダル | **必要** |
| 投稿詳細 | `/post/[id]` | スライドイン | 不要 |
| ログイン | `/auth/login` | Push | - |
| 新規登録 | `/auth/register` | Push | - |

---

## カテゴリシステム

4種類のカテゴリで投稿を分類:

| ID | ラベル | カラー | 期限ルール |
|----|--------|--------|-----------|
| `stock` | 物資 | `#10B981` (emerald) | 投稿者選択（today/48h/3日/1週間/手動） |
| `event` | イベント | `#F59E0B` (amber) | 開催日の 23:59 まで |
| `help` | 近助 | `#F43F5E` (rose) | 48時間（手動終了可） |
| `admin` | 行政 | `#8B5CF6` (violet) | 申請期限まで |

各カテゴリにはアクションボタンが紐づく:
- 物資 → 「電話する」
- イベント → 「参加する」
- 近助 → 「協力する」
- 行政 → 「公式サイト」

---

## 型定義（主要）

```typescript
User        // id, displayName, avatar, verified, stats
Place       // id, name, address, latitude, longitude
Post        // id, category, title, content, author, place, distance, images, details, ...
PostDetails // カテゴリ別詳細（price, eventDate, helpType, deadline 等）
Comment     // id, author, content, canHelp, createdAt
PostFormData // 投稿作成フォーム（Post + PostDetails の入力用）
Profile     // useProfile 用（displayName, avatar, stats）
MyPostItem  // useMyPosts 用（id, category, title, time, status, commentCount）
```

---

## Supabase テーブル構成（推定）

postsApi.ts の SELECT 句・INSERT から判明するテーブル:

| テーブル | 主要カラム | 備考 |
|---------|-----------|------|
| `users` | id, display_name, avatar, verified, email, phone | Supabase Auth と連携 |
| `posts` | id, author_id, category, title, content, place_id, location(POINT), allow_comments, expires_at, is_ended, created_at | location は PostGIS geography 型 |
| `places` | id, name, address, latitude, longitude, source | 場所マスター |
| `post_details` | post_id, price, stock_status, stock_duration, event_date, event_time, fee, max_participants, current_participants, help_type, reward, estimated_time, deadline, requirements | 1:1 で posts に紐づく |
| `post_images` | post_id, image_url, display_order | 1:N |
| `comments` | id, post_id, author_id, content, ... | 1:N |

### RPC 関数

- `get_nearby_posts(user_lat, user_lng, radius_meters, category_filter)` → `{ id, distance_meters }[]`

### Storage バケット

- `post-images` — 投稿画像の保存先

---

## フック依存関係

```
useAuth
  └── supabase.auth (セッション管理)

useLocation
  └── expo-location (GPS)

usePosts
  ├── useLocation の coords を受け取る
  ├── postsApi.fetchNearbyPosts
  └── mockData.MOCK_POSTS (フォールバック)

usePost
  ├── postsApi.fetchPostById
  └── mockData.MOCK_POSTS (フォールバック)

useProfile
  └── useAuth → supabase (users + 集計クエリ)

useMyPosts
  └── useAuth → supabase (posts クエリ)
```

---

## 環境変数

| 変数名 | 用途 |
|--------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `EXPO_PUBLIC_MAPTILER_KEY` | MapTiler API キー（地図実装時に使用） |
