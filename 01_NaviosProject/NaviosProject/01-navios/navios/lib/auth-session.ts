import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions, getLegacyUsers } from "@/lib/auth-options";

export type AuthRole = "user" | "admin";

export type SessionActor = {
  userId: string;
  role: AuthRole;
  email: string;
  username?: string;
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

export function authenticate(email: string, password: string): SessionActor | null {
  const normalized = email.trim().toLowerCase();
  const found = getLegacyUsers().find(
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

async function getSessionActorFromNextAuthCookie(request: Request): Promise<SessionActor | null> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-navios-auth-secret";
  const token = await getToken({
    req: {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    } as never,
    secret,
  });

  if (!token?.sub || !token.email) return null;
  return {
    userId: String(token.sub),
    role: String(token.role ?? "user") as AuthRole,
    email: String(token.email),
    username: token.name ? String(token.name) : undefined,
  };
}

export async function getSessionActorFromRequest(request: Request): Promise<SessionActor | null> {
  const token = readCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) {
    const legacy = parseSessionToken(token);
    if (legacy) return legacy;
  }

  return getSessionActorFromNextAuthCookie(request);
}

export async function getSessionActorFromServer(): Promise<SessionActor | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const legacy = parseSessionToken(token);
    if (legacy) return legacy;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) return null;
  return {
    userId: session.user.id,
    role: (session.user.role as AuthRole) ?? "user",
    email: session.user.email,
    username: session.user.name ?? undefined,
  };
}
