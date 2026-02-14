# Authentication / Authorization Spec (Pre-Implementation)

## Scope

- Public read: event list/detail is public
- Protected write: update/delete requires authenticated actor
- Ownership: only owner can edit/delete their own event
- Admin override: admin can edit/delete any event

## Data model

- `Event.author_id` (nullable string)
  - set on create when actor exists
  - legacy/null events are treated as ownerless

## API authorization policy

- `POST /api/events`
  - actor optional for now
  - if actor exists, save `author_id`
  - if no actor, create as ownerless (`author_id = null`)
- `PUT /api/events/:id`
  - no actor -> `401 UNAUTHORIZED`
  - event not found -> `404 NOT_FOUND`
  - actor is not owner/admin -> `403 FORBIDDEN`
- `DELETE /api/events/:id`
  - same rules as `PUT`

## Temporary actor resolution (until real login)

- Server reads:
  - `x-user-id`
  - `x-user-role` (`admin` or `user`)
- Client generates persistent local actor id via localStorage (`navios_actor_id`) and sends `x-user-id`.

## Planned replacement with real auth

- Replace header-based actor resolution with session-based auth provider (Auth.js planned).
- Keep ownership check logic unchanged (`author_id === session.user.id` or admin role).
