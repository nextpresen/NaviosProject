import { prisma } from "@/lib/prisma";

function fallbackUsername(email: string, userId: string) {
  return email.split("@")[0] || userId;
}

export async function getUsername(userId: string, email: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: userId },
      select: { username: true },
    });
    return profile?.username ?? fallbackUsername(email, userId);
  } catch {
    return fallbackUsername(email, userId);
  }
}

export async function saveUsername(userId: string, email: string, username: string) {
  const next = username.trim() || fallbackUsername(email, userId);
  const profile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: { username: next },
    create: { user_id: userId, username: next },
    select: { username: true },
  });
  return profile.username;
}
