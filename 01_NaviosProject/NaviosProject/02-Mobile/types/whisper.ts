export type WhisperUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export type ReactionType = 'thanks' | 'useful' | 'wantToGo' | 'funny' | 'agree';

export type ReactionSummary = {
  type: ReactionType;
  count: number;
};

export type Whisper = {
  id: string;
  user: WhisperUser;
  content: string;
  latitude: number;
  longitude: number;
  areaName: string;
  distanceMeters: number;
  createdAt: string;
  expiresAt: string;
  replyCount: number;
  reactionCount: number;
  reactions: ReactionSummary[];
};

export type WhisperReply = {
  id: string;
  whisperId: string;
  user: WhisperUser;
  content: string;
  createdAt: string;
};

export type AreaGroup = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  activeUserCount: number;
  whisperCount: number;
};

export const REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string }> = {
  thanks: { label: 'ありがとう', emoji: '🙏' },
  useful: { label: '助かった', emoji: '👍' },
  wantToGo: { label: '行きたい', emoji: '🏃' },
  funny: { label: '笑', emoji: '😂' },
  agree: { label: 'わかる', emoji: '💡' },
};

export function calcWhisperOpacity(whisper: Whisper): number {
  const maxDistance = 500;
  const distanceRatio = Math.min(whisper.distanceMeters / maxDistance, 1);
  const distanceOpacity = 1 - distanceRatio * 0.85;

  const createdTime = new Date(whisper.createdAt).getTime();
  const expiresTime = new Date(whisper.expiresAt).getTime();
  const nowTime = Date.now();
  const totalLifespan = expiresTime - createdTime;
  const elapsed = nowTime - createdTime;
  const timeRatio = Math.min(elapsed / totalLifespan, 1);
  const timeOpacity = 1 - timeRatio * 0.7;

  return Math.max(0, distanceOpacity * timeOpacity);
}

export function remainingPercent(whisper: Whisper): number {
  const created = new Date(whisper.createdAt).getTime();
  const expires = new Date(whisper.expiresAt).getTime();
  const total = expires - created;
  const remaining = expires - Date.now();
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

// =============================================================
// Fallback mock data — Supabase 未接続時のみ使用
// =============================================================

const MOCK_USERS: WhisperUser[] = [
  { id: 'u1', username: 'たかし', avatarUrl: null },
  { id: 'u2', username: 'ゆきこ', avatarUrl: null },
  { id: 'u3', username: 'けんた', avatarUrl: null },
  { id: 'u4', username: 'さくら', avatarUrl: null },
  { id: 'u5', username: 'まさお', avatarUrl: null },
  { id: 'u6', username: 'あいこ', avatarUrl: null },
  { id: 'u7', username: 'りょう', avatarUrl: null },
  { id: 'u8', username: 'みほ', avatarUrl: null },
  { id: 'u9', username: 'だいき', avatarUrl: null },
  { id: 'u10', username: 'ことね', avatarUrl: null },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const hoursLater = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

export const MOCK_AREAS: AreaGroup[] = [
  { id: 'area1', name: '渋谷駅前', latitude: 35.6581, longitude: 139.7017, radiusMeters: 300, activeUserCount: 24, whisperCount: 8 },
  { id: 'area2', name: '宮益坂エリア', latitude: 35.6595, longitude: 139.7045, radiusMeters: 200, activeUserCount: 9, whisperCount: 4 },
  { id: 'area3', name: 'センター街', latitude: 35.6595, longitude: 139.6988, radiusMeters: 200, activeUserCount: 31, whisperCount: 12 },
  { id: 'area4', name: '代々木公園', latitude: 35.6715, longitude: 139.6948, radiusMeters: 500, activeUserCount: 15, whisperCount: 6 },
];

export const MOCK_WHISPERS: Whisper[] = [
  { id: 'w1', user: MOCK_USERS[0], content: 'ハチ公前めっちゃ人いる。待ち合わせの人は東口の方がいいかも', latitude: 35.658, longitude: 139.7015, areaName: '渋谷駅前', distanceMeters: 30, createdAt: hoursAgo(0.5), expiresAt: hoursLater(23.5), replyCount: 3, reactionCount: 8, reactions: [{ type: 'useful', count: 5 }, { type: 'thanks', count: 3 }] },
  { id: 'w2', user: MOCK_USERS[1], content: '駅前のスタバ、今なら空いてるよ〜', latitude: 35.6583, longitude: 139.702, areaName: '渋谷駅前', distanceMeters: 50, createdAt: hoursAgo(1), expiresAt: hoursLater(23), replyCount: 1, reactionCount: 4, reactions: [{ type: 'wantToGo', count: 3 }, { type: 'thanks', count: 1 }] },
  { id: 'w3', user: MOCK_USERS[2], content: '109の前でストリートライブやってる！うまい', latitude: 35.659, longitude: 139.7005, areaName: '渋谷駅前', distanceMeters: 80, createdAt: hoursAgo(0.2), expiresAt: hoursLater(23.8), replyCount: 5, reactionCount: 12, reactions: [{ type: 'wantToGo', count: 7 }, { type: 'funny', count: 3 }, { type: 'agree', count: 2 }] },
  { id: 'w4', user: MOCK_USERS[3], content: '宮益坂のパン屋、今日クロワッサン焼きたて出してる', latitude: 35.6593, longitude: 139.704, areaName: '宮益坂エリア', distanceMeters: 150, createdAt: hoursAgo(2), expiresAt: hoursLater(22), replyCount: 2, reactionCount: 6, reactions: [{ type: 'wantToGo', count: 4 }, { type: 'useful', count: 2 }] },
  { id: 'w5', user: MOCK_USERS[4], content: 'この辺でランチおすすめある？和食がいいな', latitude: 35.6598, longitude: 139.7035, areaName: '宮益坂エリア', distanceMeters: 200, createdAt: hoursAgo(1.5), expiresAt: hoursLater(22.5), replyCount: 4, reactionCount: 2, reactions: [{ type: 'agree', count: 2 }] },
  { id: 'w6', user: MOCK_USERS[5], content: 'センター街の古着屋セールやってる！50%オフ', latitude: 35.66, longitude: 139.6985, areaName: 'センター街', distanceMeters: 300, createdAt: hoursAgo(3), expiresAt: hoursLater(21), replyCount: 7, reactionCount: 15, reactions: [{ type: 'wantToGo', count: 9 }, { type: 'useful', count: 4 }, { type: 'thanks', count: 2 }] },
  { id: 'w7', user: MOCK_USERS[6], content: 'タピオカの新しい店できてるけど行列やば', latitude: 35.6598, longitude: 139.699, areaName: 'センター街', distanceMeters: 350, createdAt: hoursAgo(4), expiresAt: hoursLater(20), replyCount: 2, reactionCount: 5, reactions: [{ type: 'funny', count: 3 }, { type: 'agree', count: 2 }] },
  { id: 'w8', user: MOCK_USERS[7], content: '代々木公園の桜、三分咲きくらい。来週が見頃かも', latitude: 35.671, longitude: 139.6945, areaName: '代々木公園', distanceMeters: 1500, createdAt: hoursAgo(5), expiresAt: hoursLater(19), replyCount: 8, reactionCount: 22, reactions: [{ type: 'wantToGo', count: 14 }, { type: 'useful', count: 5 }, { type: 'thanks', count: 3 }] },
  { id: 'w9', user: MOCK_USERS[8], content: '公園のベンチ、噴水の裏側が空いてるよ', latitude: 35.672, longitude: 139.695, areaName: '代々木公園', distanceMeters: 1600, createdAt: hoursAgo(6), expiresAt: hoursLater(18), replyCount: 0, reactionCount: 3, reactions: [{ type: 'thanks', count: 2 }, { type: 'useful', count: 1 }] },
  { id: 'w10', user: MOCK_USERS[9], content: '渋谷駅の工事、南口あたり通りにくくなってる', latitude: 35.6578, longitude: 139.7018, areaName: '渋谷駅前', distanceMeters: 40, createdAt: hoursAgo(22), expiresAt: hoursLater(2), replyCount: 6, reactionCount: 18, reactions: [{ type: 'useful', count: 10 }, { type: 'thanks', count: 5 }, { type: 'agree', count: 3 }] },
];

export const MOCK_REPLIES: WhisperReply[] = [
  { id: 'r1', whisperId: 'w1', user: MOCK_USERS[3], content: '東口のモヤイ像前が穴場だよ', createdAt: hoursAgo(0.4) },
  { id: 'r2', whisperId: 'w1', user: MOCK_USERS[5], content: 'ハチ公前、外国人観光客でいつも混んでるよね', createdAt: hoursAgo(0.3) },
  { id: 'r3', whisperId: 'w1', user: MOCK_USERS[8], content: 'ありがとう！東口にします', createdAt: hoursAgo(0.1) },
];

export { MOCK_USERS };
