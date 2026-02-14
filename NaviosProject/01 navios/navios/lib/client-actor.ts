const KEY = "navios_actor_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `actor-${Date.now()}`;
}

export function getOrCreateActorId(): string | null {
  if (typeof window === "undefined") return null;

  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;

  const next = randomId();
  window.localStorage.setItem(KEY, next);
  return next;
}
