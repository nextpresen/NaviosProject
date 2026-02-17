# API Flow Test Coverage (E2E-like)

`npm run test` executes:

1. `next build` (production-equivalent route output)
2. `scripts/test-api-flow.mjs`

`test-api-flow.mjs` validates:

1. `GET /api/events` list retrieval
2. `POST /api/events` create
3. `PUT /api/events/:id` with invalid payload -> `400`
4. `PUT /api/events/:id` by non-owner -> `403`
5. `PUT /api/events/:id` valid owner update (new/edit equivalent)
6. `GET /api/events/:id` reflects updated data
7. `DELETE /api/events/:id`
8. Post-delete `GET /api/events/:id` returns `404`
