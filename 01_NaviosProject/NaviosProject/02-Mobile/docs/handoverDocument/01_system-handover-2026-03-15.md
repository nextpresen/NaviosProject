# System Handover Document

**Project**: NaviOs Mobile App
**Date**: 2026-03-15
**Stack**: Expo 55 / React Native 0.83 / TypeScript 5.9 / Supabase

---

## 1. System Overview

```
┌─────────────────────────────────────────────────┐
│                   Mobile App                     │
│  Expo 55 + React Native 0.83 + TypeScript 5.9   │
│                                                  │
│  ┌──────┐ ┌───────┐ ┌─────┐ ┌──────┐ ┌────┐    │
│  │ Talk │ │Navios │ │ Map │ │ Feed │ │ My │    │
│  └──┬───┘ └───┬───┘ └──┬──┘ └──┬───┘ └─┬──┘    │
│     │         │        │       │        │        │
│  ┌──┴─────────┴────────┴───────┴────────┴──┐    │
│  │           hooks/ (状態管理)              │    │
│  └──────────────────┬──────────────────────┘    │
│  ┌──────────────────┴──────────────────────┐    │
│  │           lib/ (サービス層)             │    │
│  └──────────────────┬──────────────────────┘    │
└─────────────────────┼───────────────────────────┘
                      │ HTTPS
┌─────────────────────┴───────────────────────────┐
│               Supabase (Backend)                 │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐ │
│  │  Auth  │ │ Postgres │ │ PostGIS │ │Storage│ │
│  │        │ │ + RLS    │ │  (RPC)  │ │       │ │
│  └────────┘ └──────────┘ └─────────┘ └───────┘ │
└─────────────────────────────────────────────────┘
```

---

## 2. Screen List

| Tab | Route | File | Lines | Description |
|-----|-------|------|-------|-------------|
| Talk | `/(tabs)/talk` | `app/(tabs)/talk.tsx` | 755 | 距離フェード型つぶやき。3段階カード(Near/Mid/Far) |
| Navios | `/(tabs)/index` | `app/(tabs)/index.tsx` | 622 | AI検索。Question AIインターフェース |
| Map | `/(tabs)/nearby` | `app/(tabs)/nearby.tsx` | 642 | 近くの投稿フィード + フローティングカード |
| Feed | `/(tabs)/search` | `app/(tabs)/search.tsx` | 375 | タイムライン。セクション別表示 |
| My | `/(tabs)/profile` | `app/(tabs)/profile.tsx` | 859 | プロフィール + 2x2 stats + 投稿一覧 + FAB |
| - | `/post/[id]` | `app/post/[id].tsx` | 752 | 投稿詳細 + コメント + いいね |
| - | `/post/create` | `app/post/create.tsx` | 796 | 3ステップ投稿作成ウィザード |
| - | `/post/success` | `app/post/success.tsx` | 131 | 投稿成功画面 |
| - | `/auth/login` | `app/auth/login.tsx` | 182 | ログイン |
| - | `/auth/register` | `app/auth/register.tsx` | 209 | 新規登録 |
| - | `_layout` | `app/_layout.tsx` | 84 | Root stack + 認証ルーティング |
| - | `(tabs)/_layout` | `app/(tabs)/_layout.tsx` | 89 | 5タブナビゲーション |

---

## 3. Directory Structure & Responsibilities

```
02-Mobile/
├── app/                          # 画面 (Expo Router)
│   ├── (tabs)/                   #   5タブ: Talk | Navios | Map | Feed | My
│   ├── auth/                     #   ログイン / 新規登録
│   └── post/                     #   投稿詳細 / 作成 / 成功
├── components/                   # 再利用UIコンポーネント
│   ├── common/                   #   汎用 (Avatar, Badge, Skeleton等)
│   ├── map/                      #   地図関連
│   └── post/                     #   投稿カード, 作成ステップ等
├── hooks/                        # カスタムhooks (5ファイル)
├── lib/                          # サービス層 (5ファイル)
├── constants/                    # 色, カテゴリ, デザイントークン
├── types/                        # 型定義 (Post, Whisper等)
├── supabase/migrations/          # DBマイグレーション SQL
├── docs/                         # ドキュメント
│   ├── handoverDocument/         #   引き継ぎ資料
│   └── applicationDocument/      #   アプリ概要資料
└── assets/                       # 画像等
```

---

## 4. Dependencies

### Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~55.0.5 | フレームワーク |
| react-native | 0.83.2 | UIランタイム |
| @supabase/supabase-js | ^2.99.1 | Backend接続 |
| expo-router | ~55.0.4 | ファイルベースルーティング |
| expo-location | ~55.1.2 | 位置情報 |
| expo-image-picker | ~55.0.11 | 画像選択 |
| expo-image-manipulator | ~55.0.10 | 画像最適化 |
| expo-haptics | ~55.0.8 | ハプティックフィードバック |
| react-native-maps | 1.26.20 | 地図表示（置き換え予定） |
| @react-native-async-storage/async-storage | 2.2.0 | セッション永続化 |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ~5.9.2 | 型チェック |
| @types/react | ~19.2.2 | React型定義 |

---

## 5. Database Schema

### 投稿系テーブル
- `users` — ユーザープロフィール (display_name, avatar, verified, email, phone)
- `posts` — 投稿 (title, content, category, author_id, is_ended)
- `post_details` — カテゴリ別詳細 (price, event_date等)
- `comments` — コメント (post_id, user_id, content)
- `places` — 場所 (name, address, latitude, longitude)
- `post_images` — 投稿画像 (post_id, url, display_order)
- `post_likes` — いいね (post_id, user_id)

### Talk系テーブル (001_whispers.sql)
- `whispers` — つぶやき (user_id, content, lat/lng, location geography, expires_at 24h)
- `whisper_replies` — 返信 (whisper_id, user_id, content)
- `whisper_reactions` — リアクション (whisper_id, user_id, reaction_type)

### RPC
- `get_nearby_posts(user_lat, user_lng, radius_meters, category_filter)` — PostGIS距離検索
- `get_nearby_whispers(user_lat, user_lng, radius_meters)` — 24h有効つぶやき距離検索

### Storage Buckets
- `images` — 投稿画像
- `avatars` — アバター画像

---

## 6. Known Issues & Technical Debt

| Issue | Severity | Detail |
|-------|----------|--------|
| profile.tsx 859行 | Low | 分割推奨。Stats/PostList/Account をサブコンポーネントに |
| whispers FK問題 | Info | whispers.user_id → auth.users。public.users とのjoin不可。別クエリで対応済み |
| react-native-maps 置き換え | Medium | MapTilerベースに移行予定。MapView.tsx は暫定実装 |
| Talk モックデータ残存 | Info | types/whisper.ts にフォールバック用モック。Supabase接続時は未使用 |
| postService.ts 559行 | Low | 大きくなりつつある。画像系を別ファイルに分離検討 |

---

## 7. Next Phase Priority

```
Phase 1 (機能完成)
├── MapTiler 地図表示実装
├── Google Places 場所検索実装
└── 実機テスト (iOS / Android)

Phase 2 (品質向上)
├── RLS ポリシー全テーブル監査
├── パスワードリセット機能
├── エラー監視 (Sentry)
└── コメント楽観更新

Phase 3 (リリース準備)
├── EAS Build 設定 (dev / preview / production)
├── アプリアイコン / スプラッシュ
├── プライバシーポリシー / 利用規約
├── スクリーンショット準備
└── Apple Developer / Google Play 登録

Phase 4 (運用)
├── プッシュ通知
├── アナリティクス
└── OTA アップデート (EAS Update)
```

---

## 8. Environment Setup

```bash
# Clone & install
cd 02-Mobile
npm install
npx expo install expo-haptics expo-image-manipulator expo-image-picker

# Required .env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_MAPTILER_API_KEY=xxx        # 未使用（Phase 1 で実装）
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=xxx   # 未使用（Phase 1 で実装）

# DB migration
# Supabase SQL Editor で supabase/migrations/001_whispers.sql を実行
# PostGIS 拡張: create extension if not exists postgis;

# Start
npx expo start
```
