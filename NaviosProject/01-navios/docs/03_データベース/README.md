# 03_データベース

最終更新: 2026-02-16

## このフォルダについて

Naviosのデータベース設計に関するドキュメントが格納されています。

## ファイル一覧

### database設計.md

データベースの全体設計書です。

**内容:**
- 採用構成（SQLite/PostgreSQL）
- テーブル設計
  - Event（イベント）
  - UserProfile（ユーザープロフィール）
  - UserAccount（認証アカウント）
- イベント表示ポリシー
- 主な関連API
- Prismaスキーマ

**重要なポイント:**
- イベントデータは削除せず履歴として保持
- 終了後24時間を超えたイベントは「アーカイブ扱い」
- 逆ジオコーディングで住所を自動補完

## データベースの構成

### 開発環境
- **種類**: SQLite
- **接続文字列**: `file:/tmp/navios-dev.db`
- **スキーマファイル**: `navios/prisma/schema.prisma`

### 本番環境（予定）
- **種類**: PostgreSQL
- **スキーマファイル**: `navios/prisma/schema.supabase.prisma`

## 主要テーブル

### Event（イベント）
投稿されたイベント情報を保存するメインテーブル。

**主要カラム:**
- `id`, `title`, `content` - 基本情報
- `latitude`, `longitude` - 位置情報
- `address` - 住所（逆ジオコーディングで自動取得）
- `start_at`, `end_at` - 開催期間
- `category`, `tags_json` - 分類
- `view_count`, `popularity_score` - 統計情報

### UserAccount（認証）
ログイン用のアカウント情報。

### UserProfile（プロフィール）
ユーザーの表示名やアバター画像。

## データベース操作コマンド

```bash
# データベースの初期化
npm run prisma:generate
npm run prisma:migrate

# サンプルデータ投入
npm run prisma:seed

# データベースGUIツール起動
npx prisma studio
```

詳しくは [04_開発ガイド/コマンド一覧.md] を参照してください。

## 関連ドキュメント

- [02_設計書/Phase1設計書.md] - データモデルの詳細
- [04_開発ガイド/環境構築ガイド.md] - データベースのセットアップ手順
