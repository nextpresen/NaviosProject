# Navios データベース設計書

最終更新: 2026-02-16  
対象システム: `NaviosProject/01-navios/navios`  
ORM: Prisma  

## 1. 採用構成

- 開発環境DB: SQLite
- 接続文字列: `.env` の `DATABASE_URL`（現状 `file:/tmp/navios-dev.db`）
- 本番候補: PostgreSQL（`prisma/schema.supabase.prisma` で互換スキーマを保持）

## 2. テーブル設計

### 2.1 Event

イベント投稿の本体テーブル。  
終了したイベントも削除せず、履歴資産として保持する。

| カラム名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | `String` | Yes | `cuid()` | イベントID（PK） |
| `title` | `String` | Yes | - | タイトル |
| `content` | `String` | Yes | - | 本文 |
| `author_id` | `String?` | No | `null` | 投稿者ID |
| `author_avatar_url` | `String?` | No | `null` | 投稿者アバターURL |
| `category` | `String` | Yes | `"event"` | カテゴリ |
| `tags_json` | `String` | Yes | `"[]"` | タグJSON |
| `latitude` | `Float` | Yes | - | 緯度 |
| `longitude` | `Float` | Yes | - | 経度 |
| `address` | `String?` | No | `null` | 緯度経度から逆ジオコーディングした住所文字列 |
| `start_at` | `DateTime?` | No | `null` | 開始日時 |
| `end_at` | `DateTime?` | No | `null` | 終了日時 |
| `is_all_day` | `Boolean` | Yes | `false` | 終日フラグ |
| `event_date` | `DateTime` | Yes | - | 開催日（開始日） |
| `expire_date` | `DateTime` | Yes | - | 終了日 |
| `event_image` | `String` | Yes | - | 画像URL / Data URL |
| `view_count` | `Int` | Yes | `0` | 詳細ページ閲覧数（30分同一ブラウザ再計測抑制） |
| `popularity_score` | `Int` | Yes | `0` | 人気スコア（過去人気表示の並び替えに使用） |
| `created_at` | `DateTime` | Yes | `now()` | 作成日時 |
| `updated_at` | `DateTime` | Yes | `@updatedAt` | 更新日時 |

### 2.2 UserProfile

ユーザープロフィール管理。

| カラム名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `user_id` | `String` | Yes | - | ユーザーID（PK） |
| `username` | `String` | Yes | - | 表示名 |
| `avatar_url` | `String?` | No | `null` | アバター画像URL |
| `created_at` | `DateTime` | Yes | `now()` | 作成日時 |
| `updated_at` | `DateTime` | Yes | `@updatedAt` | 更新日時 |

### 2.3 UserAccount

認証用アカウント管理。

| カラム名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | `String` | Yes | `cuid()` | アカウントID（PK） |
| `email` | `String` | Yes | - | メールアドレス（ユニーク） |
| `password_hash` | `String` | Yes | - | パスワードハッシュ |
| `role` | `String` | Yes | `"user"` | ロール |
| `created_at` | `DateTime` | Yes | `now()` | 作成日時 |
| `updated_at` | `DateTime` | Yes | `@updatedAt` | 更新日時 |

## 3. イベント表示ポリシー（現行）

### 3.1 履歴保持

- `Event` は削除しない前提（履歴資産）
- 過去分析や人気ランキング用途で保持する

### 3.2 通常UI表示（アーカイブ運用）

- `ended`（終了）イベントは、終了後24時間のみ通常一覧に表示
- 終了後24時間を超えたイベントは「archive扱い」として通常一覧から除外
- 物理削除は行わない

### 3.3 過去人気表示

- archive扱いイベントを別APIで取得
- 並び順: `popularity_score` 降順 → `end_at` 降順
- 通常一覧とは分離した「PAST POPULAR」枠で表示

## 4. 主な関連API（現行）

- 通常一覧: `GET /api/events`
  - archive扱いイベントは除外
- 過去人気: `GET /api/events/popular-past?limit=3`
  - archive扱いイベントを人気順で返す
- 閲覧数加算: `POST /api/events/{id}/view`
  - `view_count` を `+1` 更新して返却
  - フロント側で同一ブラウザ30分以内の重複加算を抑制
- 投稿作成/更新: `POST /api/events`, `PUT /api/events/{id}`
  - `latitude/longitude` から逆ジオコーディングを実行して `address` を保存
  - 逆ジオコーディング失敗時は `address = null` で保存継続（投稿自体は失敗させない）

## 5. Prismaスキーマ

- SQLite用: `navios/prisma/schema.prisma`
- PostgreSQL用: `navios/prisma/schema.supabase.prisma`

両スキーマは `Event` / `UserProfile` / `UserAccount` で整合を取る運用とする。
