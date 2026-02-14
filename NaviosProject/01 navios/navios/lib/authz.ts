export type AuthRole = "user" | "admin";

export type AuthActor = {
  userId: string;
  role: AuthRole;
};

export function getAuthActor(request: Request): AuthActor | null {
  const userId = request.headers.get("x-user-id")?.trim();
  if (!userId) return null;

  const rawRole = request.headers.get("x-user-role")?.trim().toLowerCase();
  const role: AuthRole = rawRole === "admin" ? "admin" : "user";
  return { userId, role };
}

export function canManageEvent(
  actor: AuthActor,
  authorId: string | null | undefined,
): boolean {
  if (actor.role === "admin") return true;
  return Boolean(authorId && authorId === actor.userId);
}
