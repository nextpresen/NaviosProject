# Navios

Navios is a Next.js App Router project for location-based event discovery and posting.

## Tech stack

- Next.js 16 (App Router)
- Tailwind CSS
- Leaflet + react-leaflet
- Prisma ORM
- SQLite (local dev) / PostgreSQL (production)

## Local setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

Default local DB:

```env
DATABASE_URL="file:/tmp/navios-dev.db"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="change-this-secret"
NEXTAUTH_SECRET="change-this-secret"
AUTH_USERS_JSON='[{"id":"demo-user","email":"user@navios.local","password":"user1234","role":"user"},{"id":"demo-admin","email":"admin@navios.local","password":"admin1234","role":"admin"}]'
```

3. Prepare database

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Start dev server

```bash
npm run dev
```

Open:

- Main map: `http://localhost:3000/`
- New post page: `http://localhost:3000/new`
- Login page: `http://localhost:3000/login`
- Signup page: `http://localhost:3000/signup`
- User indicator page: `http://localhost:3000/me`
  - Username and avatar icon can be edited on this page

## Useful scripts

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run test:e2e
npm run scrape:events:csv -- --url https://example.com/events
npm run supabase:import:events:csv -- --file ./events_for_supabase.csv
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:generate:supabase
npm run prisma:migrate:supabase
npm run supabase:rehearsal
```

## Scraping -> CSV -> Supabase import

`Event` テーブル列に合わせたCSVを出力し、そのままSupabaseへ投入できます。

1. JSON-LD (`application/ld+json`) を含むページからイベントを抽出してCSV生成

```bash
npm run scrape:events:csv -- \
  --url https://example.com/events \
  --out ./events_for_supabase.csv \
  --category event
```

- KCIC専用例（`event_list`の独自HTMLを抽出、緯度経度はデフォルト値で補完）

```bash
npm run scrape:events:csv -- \
  --url https://www.kcic.jp/event_list \
  --kcic-max-pages 3 \
  --default-lat 31.5966 \
  --default-lng 130.5571 \
  --out ./events_for_supabase.csv
```

- 複数URL指定: `--url` を複数回指定
- URL一覧ファイル指定: `--urls-file ./urls.txt`

2. CSVをSupabaseへ投入

```bash
SUPABASE_DATABASE_URL="postgresql://..." \
npm run supabase:import:events:csv -- --file ./events_for_supabase.csv
```

- `SUPABASE_DATABASE_URL` が設定されていれば自動で `DATABASE_URL` として利用
- Prisma `createMany(skipDuplicates: true)` でバッチ投入

## API summary

### `GET /api/events`

Query params:

- `status=all|today|upcoming|ended`
- `q=<text>`
- `lat=<number>&lng=<number>&radius=<km>`

### `POST /api/events`

Request body:

```json
{
  "title": "イベント名",
  "content": "本文",
  "category": "festival|gourmet|nature|culture|other",
  "latitude": 31.573,
  "longitude": 130.345,
  "event_date": "2026-03-01",
  "expire_date": "2026-03-01",
  "event_image": "https://... or data:image/...;base64,..."
}
```

- Requires logged-in session and stores `author_id = session.user.id`.
- `event_image` は `http/https` URL またはフォームアップロード由来の `data:image/...` を受け付けます。
- `author_avatar_url` は省略時にログインユーザープロフィール画像（未設定時はメール由来のデフォルト画像）を自動使用します。

Map marker behavior:

- ピン本体は時間軸ステータス（LIVE NOW/SOON/FINISHED）
- カテゴリはピン上のカテゴリチップ（絵文字+色）
- アニメーションは選択中ピンのみ

### `GET /api/events/:id`

- Returns a single event

### `PUT /api/events/:id`

- Updates an event (same payload schema as `POST /api/events`)
- Requires owner/admin session

### `DELETE /api/events/:id`

- Deletes an event by id
- Requires owner/admin session

UI behavior:

- On `/event/:id`, edit/delete buttons are shown only to owner/admin.

### Auth APIs

- `GET/POST /api/auth/[...nextauth]` (Auth.js)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile` (`{ "username": "...", "avatar_url": "data:image/... or https://..." }`)

Notes:

- Login UI uses Auth.js Credentials (`signIn("credentials")`).
- Signup UI uses `/api/auth/register` then `signIn("credentials")`.
- Legacy `/api/auth/login` cookie is kept for test/backward compatibility.

### `GET /api/geocode?q=鹿児島市`

- Proxies Nominatim search
- Includes server-side cache and simple rate limiting

## API response format

Success:

```json
{
  "ok": true,
  "data": { "...": "..." }
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload",
    "issues": {}
  }
}
```

Compatibility fields (`events`, `event`, `results`) are also returned where applicable.

## Production notes (Supabase)

1. Copy `.env.production.example` values into production env vars.
2. Set `DATABASE_URL` and `SUPABASE_DATABASE_URL` to Supabase PostgreSQL connection strings.
3. Run rehearsal commands:

```bash
npm run prisma:generate:supabase
npm run prisma:migrate:supabase
```

4. For local development, keep `DATABASE_URL=file:/tmp/navios-dev.db` and use normal `prisma:*` scripts.
5. Run final connectivity rehearsal:

```bash
npm run supabase:rehearsal
```

Latest rehearsal result (2026-02-14):

- `Supabase CRUD rehearsal passed`
- `createdId: cmlmgpyh60000btwtglh3aqch`

Latest rehearsal result (2026-02-15):

- `Supabase CRUD rehearsal passed`
- `createdId: cmlmn2xfm0000bt7qkz7dkfp1`
- `updatedTitle: Supabase rehearsal 1771093061805 updated`

## SEO / Share settings

- Set `NEXT_PUBLIC_SITE_URL` to your canonical domain (example: `https://navios.life`).
- `robots.txt` is generated from `app/robots.ts`.
- `sitemap.xml` is generated from `app/sitemap.ts` and includes `/event/:id` pages.
- Event detail pages include JSON-LD (`schema.org/Event`) for rich result indexing.

## Test strategy

- `npm run test` runs an e2e-like API flow:
  - build app (`next build`)
  - execute `scripts/test-api-flow.mjs`
  - verify list/create/invalid-update/valid-update/detail/delete

## Production checklist

- See `docs.production-checklist.md`.
- Auth/Authz draft: `docs.authz-spec.md`.

## Roadmap note

- Admin dashboard (`/admin`) is planned for Phase 2.
