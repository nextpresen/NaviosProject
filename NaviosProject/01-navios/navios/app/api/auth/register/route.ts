import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fail, ok } from "@/lib/api-response";
import { getLegacyUsers } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { saveUsername } from "@/lib/user-profile";

const schema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
  username: z.string().trim().min(1).max(24).optional(),
});

function fallbackName(email: string) {
  return email.split("@")[0] || "user";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      fail("VALIDATION_ERROR", "Invalid register payload", parsed.error.flatten()),
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const username = parsed.data.username?.trim() || fallbackName(email);

  const existsInLegacy = getLegacyUsers().some((user) => user.email.toLowerCase() === email);
  if (existsInLegacy) {
    return NextResponse.json(
      fail("CONFLICT", "このメールアドレスは既に使用されています"),
      { status: 409 },
    );
  }

  try {
    const existing = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        fail("CONFLICT", "このメールアドレスは既に使用されています"),
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const account = await prisma.userAccount.create({
      data: {
        email,
        password_hash: passwordHash,
        role: "user",
      },
      select: { id: true, email: true, role: true },
    });

    await saveUsername(account.id, account.email, username);

    return NextResponse.json(
      ok({
        account: {
          id: account.id,
          email: account.email,
          role: account.role,
          username,
        },
      }),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      fail("DB_CREATE_FAILED", "ユーザー登録に失敗しました", String(error)),
      { status: 500 },
    );
  }
}
