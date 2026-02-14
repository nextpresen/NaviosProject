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

## Useful scripts

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:generate:supabase
npm run prisma:migrate:supabase
```

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
  "latitude": 31.573,
  "longitude": 130.345,
  "event_date": "2026-03-01",
  "expire_date": "2026-03-01",
  "event_image": "https://..."
}
```

### `GET /api/events/:id`

- Returns a single event

### `PUT /api/events/:id`

- Updates an event (same payload schema as `POST /api/events`)

### `DELETE /api/events/:id`

- Deletes an event by id

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
