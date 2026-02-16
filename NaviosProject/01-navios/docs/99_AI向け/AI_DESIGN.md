# AI_DESIGN.md (Phase1)

最終更新: 2026-02-15
対象リポジトリ: `/home/zer0/ドキュメント/NaviosProject/01-navios/navios`
目的: AIエージェントが次の改修を安全に継続できるよう、現行仕様を短時間で復元する。

## 1. System Summary
- 名称: Navios
- 形式: 地図中心の地域イベント投稿/閲覧 Web アプリ
- フェーズ状態: Phase1 完了
- 主軸価値: `LIVE NOW` を最優先表示して即時意思決定を支援

## 2. Architecture Snapshot
- Frontend: Next.js App Router + React + Tailwind
- Map: Leaflet + react-leaflet（`MapContainer -> MapInner` は dynamic import / `ssr:false`）
- State: Zustand (`store/useAppStore.ts`)
- Backend: Route Handlers (`app/api/**`)
- ORM/DB: Prisma + SQLite(local) / PostgreSQL(production plan)
- Auth: Auth.js Credentials（owner/admin 認可連携）

## 3. Business Rules (Current)
- ステータス判定:
  - `today (LIVE NOW)`: `now` が `start_at <= now <= end_at`
  - `upcoming (SOON)`: `now < start_at`
  - `ended (FINISHED)`: `now > end_at`
- カテゴリ（固定）:
  - `sale`, `event`, `gourmet`, `household_support`, `public_support`, `local_news`
- タグ（固定・最大3）:
  - `free`, `under_1000`, `go_now`
- 互換運用:
  - `event_date` / `expire_date` は移行期間中保持
  - 正式判定は `start_at` / `end_at` 優先

## 4. UI Interaction Contracts
- PC:
  - サイドバー選択 or 地図ピン選択で右下カードを表示
  - Leaflet popup はPCでは実質使わず、右下カード導線を優先
- Mobile:
  - 地図ピン選択時に Leaflet popup を表示
  - popup内から詳細ページへ遷移可能（詳細導線あり）
- ロゴ押下:
  - `/` に遷移

## 5. API Contracts
- Events:
  - `GET /api/events`
  - `POST /api/events` (auth required)
  - `GET /api/events/:id`
  - `PUT /api/events/:id` (owner/admin)
  - `DELETE /api/events/:id` (owner/admin)
- Auth:
  - `GET/POST /api/auth/[...nextauth]`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/session`
  - `GET/PATCH /api/auth/profile`
- Geocode:
  - `GET /api/geocode`
- Response shape:
  - success: `{ ok: true, data: ... }`
  - error: `{ ok: false, error: { code, message, issues? } }`

## 6. Data Model Contracts (Prisma)
- `Event`
  - required core: `title`, `content`, `latitude`, `longitude`, `event_image`, `event_date`, `expire_date`
  - schedule: `start_at?`, `end_at?`, `is_all_day`
  - taxonomy: `category`, `tags_json`
  - auth relation key: `author_id`
- `UserAccount`
  - `email(unique)`, `password_hash`, `role`
- `UserProfile`
  - `user_id(pk)`, `username`, `avatar_url`

## 7. Validation & Security
- `POST/PUT` は zod バリデーション実装済み
- `start_at/end_at` の必須整合チェックあり
- `end_at >= start_at` 検証あり
- 重要更新系 API は認可を必須化

## 8. Operational Commands
- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Test: `npm run test`
- Prisma local:
  - `npm run prisma:generate`
  - `npm run prisma:migrate`
  - `npm run prisma:seed`

## 9. Known Decisions / Non-Goals (Phase1)
- クラスタリング/スパイダー表示は撤去済み（安定性優先）
- BottomSheet は調整中で常時主導線にはしていない
- finishedイベントの自動アーカイブは未実装（Phase2候補）

## 10. Recommended Phase2 Backlog
1. finishedイベントの段階アーカイブ（7-30/30-90/90+）を定期ジョブ化
2. 人気順/反応順のランキング軸追加（閲覧/保存/いいね）
3. 管理画面 `/admin` 実装
4. モバイル詳細UXを BottomSheet か popup のどちらかに統一
5. 収益化導線（スポンサー枠/特集/優先掲載）の設計とABテスト

