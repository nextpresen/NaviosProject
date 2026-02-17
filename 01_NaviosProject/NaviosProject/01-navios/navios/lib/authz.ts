import type { SessionActor } from "./auth-session";

export function canManageEvent(
  actor: SessionActor,
  authorId: string | null | undefined,
): boolean {
  if (actor.role === "admin") return true;
  return Boolean(authorId && authorId === actor.userId);
}
