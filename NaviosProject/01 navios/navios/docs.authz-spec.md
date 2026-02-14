# Authentication / Authorization Spec

## Scope

- Public read: event list/detail is public
- Protected write: update/delete requires authenticated actor
- Ownership: only owner can edit/delete their own event
- Admin override: admin can edit/delete any event

## Data model

- `Event.author_id` (nullable string)
  - set on create from session user id
  - legacy/null events are treated as ownerless and can only be managed by admin

## API authorization policy

- `POST /api/events`
  - no actor -> `401 UNAUTHORIZED`
  - save `author_id = session.user.id`
- `PUT /api/events/:id`
  - no actor -> `401 UNAUTHORIZED`
  - event not found -> `404 NOT_FOUND`
  - actor is not owner/admin -> `403 FORBIDDEN`
- `DELETE /api/events/:id`
  - same rules as `PUT`

## Session model

- Cookie-based signed session (`navios_session`) is used.
- Login API:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/session`
- Session payload:
  - `userId`
  - `role` (`user` or `admin`)
  - `email`

## User source

- `AUTH_USERS_JSON` env can provide users:
  - `[{\"id\":\"...\",\"email\":\"...\",\"password\":\"...\",\"role\":\"user|admin\"}]`
- If not set, local demo users are available for development.
