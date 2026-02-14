# Production Checklist

## Environment variables

- [ ] `DATABASE_URL` is set to Supabase Postgres primary connection
- [ ] `SUPABASE_DATABASE_URL` is set (pooling URL for rehearsal/CI)
- [ ] `NEXT_PUBLIC_APP_URL` is set to production URL
- [ ] No development DB URL (`file:/tmp/...`) remains in production

## Database

- [ ] `npm run prisma:generate:supabase` completed
- [ ] `npm run prisma:migrate:supabase` completed
- [ ] `npm run supabase:rehearsal` passed CRUD check
- [ ] Seed strategy confirmed (run once only if needed)

## API and app behavior

- [ ] `npm run lint` passed
- [ ] `npm run build` passed
- [ ] `npm run test` passed (e2e-like CRUD flow)
- [ ] Create/Update/Delete permissions policy confirmed before auth rollout

## Monitoring/operations

- [ ] Platform logs are retained and searchable (API errors, 5xx)
- [ ] DB connection saturation alert configured in Supabase
- [ ] API rate-limit thresholds reviewed (`/api/geocode`)
- [ ] On-call contact and rollback procedure documented
