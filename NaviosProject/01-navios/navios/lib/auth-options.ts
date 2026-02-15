import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserProfile } from "@/lib/user-profile";
import { prisma } from "@/lib/prisma";

type LegacyUser = {
  id: string;
  email: string;
  password: string;
  role: "user" | "admin";
};

export function getLegacyUsers(): LegacyUser[] {
  const raw = process.env.AUTH_USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as LegacyUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback defaults
    }
  }

  return [
    { id: "demo-user", email: "user@navios.local", password: "user1234", role: "user" },
    { id: "demo-user-2", email: "user2@navios.local", password: "user2234", role: "user" },
    { id: "demo-admin", email: "admin@navios.local", password: "admin1234", role: "admin" },
  ];
}

const authSecret =
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-navios-auth-secret";

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        try {
          const account = await prisma.userAccount.findUnique({
            where: { email },
            select: { id: true, email: true, password_hash: true, role: true },
          });
          if (account) {
            const matched = await bcrypt.compare(password, account.password_hash);
            if (matched) {
              const profile = await getUserProfile(account.id, account.email);
              return {
                id: account.id,
                email: account.email,
                name: profile.username,
                image: profile.avatar_url,
                role: account.role,
              };
            }
            return null;
          }
        } catch {
          // DB未初期化時はlegacyユーザーへフォールバック
        }

        const found = getLegacyUsers().find(
          (user) => user.email.toLowerCase() === email && user.password === password,
        );
        if (!found) return null;

        const profile = await getUserProfile(found.id, found.email);

        return {
          id: found.id,
          email: found.email,
          name: profile.username,
          image: profile.avatar_url,
          role: found.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.role = String(token.role ?? "user");
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }
      return session;
    },
  },
};
