import { prisma } from "@/lib/prisma";

function fallbackUsername(email: string, userId: string) {
  return email.split("@")[0] || userId;
}

function fallbackAvatar(email: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(email)}`;
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

export async function getUserProfile(userId: string, email: string) {
  const fallback = {
    username: fallbackUsername(email, userId),
    avatar_url: fallbackAvatar(email),
  };
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: userId },
      select: { username: true, avatar_url: true },
    });
    if (!profile) return fallback;
    return {
      username: profile.username || fallback.username,
      avatar_url: profile.avatar_url || fallback.avatar_url,
    };
  } catch {
    return fallback;
  }
}

export async function saveUserProfile(
  userId: string,
  email: string,
  input: { username: string; avatar_url?: string | null },
) {
  const username = input.username.trim() || fallbackUsername(email, userId);
  const avatar_url = (input.avatar_url ?? "").trim() || fallbackAvatar(email);
  const profile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: { username, avatar_url },
    create: { user_id: userId, username, avatar_url },
    select: { username: true, avatar_url: true },
  });

  // Keep existing posts in sync with latest profile avatar.
  await prisma.event.updateMany({
    where: { author_id: userId },
    data: { author_avatar_url: profile.avatar_url },
  });

  return profile;
}
