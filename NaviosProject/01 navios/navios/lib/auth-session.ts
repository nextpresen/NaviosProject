import crypto from "node:crypto";
import { cookies } from "next/headers";

export type AuthRole = "user" | "admin";

export type SessionActor = {
  userId: string;
  role: AuthRole;
  email: string;
};

type AuthUser = {
  id: string;
  email: string;
  password: string;
  role: AuthRole;
};

const SESSION_COOKIE = "navios_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 14;

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-navios-auth-secret";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function getAuthUsers(): AuthUser[] {
  const raw = process.env.AUTH_USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback to defaults
    }
  }

  return [
    { id: "demo-user", email: "user@navios.local", password: "user1234", role: "user" },
    { id: "demo-user-2", email: "user2@navios.local", password: "user2234", role: "user" },
    { id: "demo-admin", email: "admin@navios.local", password: "admin1234", role: "admin" },
  ];
}

export function authenticate(email: string, password: string): SessionActor | null {
  const normalized = email.trim().toLowerCase();
  const found = getAuthUsers().find(
    (user) => user.email.toLowerCase() === normalized && user.password === password,
  );
  if (!found) return null;
  return { userId: found.id, role: found.role, email: found.email };
}

export function createSessionToken(actor: SessionActor) {
  const payload = base64url(
    JSON.stringify({
      sub: actor.userId,
      role: actor.role,
      email: actor.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
    }),
  );
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function parseSessionToken(token: string): SessionActor | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  try {
    const data = JSON.parse(fromBase64url(payload)) as {
      sub: string;
      role: AuthRole;
      email: string;
      exp: number;
    };
    if (!data.sub || !data.role || !data.email || !data.exp) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: data.sub, role: data.role, email: data.email };
  } catch {
    return null;
  }
}

function cookieOptions(maxAgeSec: number) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure.trim(),
    `Max-Age=${maxAgeSec}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildSessionSetCookie(token: string) {
  return cookieOptions(SESSION_TTL_SEC).replace(`${SESSION_COOKIE}=`, `${SESSION_COOKIE}=${token}`);
}

export function buildSessionClearCookie() {
  return cookieOptions(0);
}

function readCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((item) => item.trim());
  const found = parts.find((item) => item.startsWith(`${key}=`));
  if (!found) return null;
  return found.slice(key.length + 1);
}

export function getSessionActorFromRequest(request: Request): SessionActor | null {
  const token = readCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  return parseSessionToken(token);
}

export async function getSessionActorFromServer(): Promise<SessionActor | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}
