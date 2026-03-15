import { isSupabaseConfigured, supabase } from './supabase';
import type { Whisper, WhisperReply, ReactionType, ReactionSummary } from '../types/whisper';

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase env is missing.');
  }
}

type UserInfo = { id: string; display_name: string; avatar: string | null };

async function fetchUserMap(userIds: string[]): Promise<Map<string, UserInfo>> {
  const map = new Map<string, UserInfo>();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from('users')
    .select('id, display_name, avatar')
    .in('id', userIds);
  for (const u of data ?? []) {
    map.set(u.id, u as UserInfo);
  }
  return map;
}

function mapWhisperRow(
  row: any,
  distance: number,
  reactions: ReactionSummary[],
  replyCount: number,
  userMap: Map<string, UserInfo>,
): Whisper {
  const u = userMap.get(row.user_id);
  return {
    id: row.id,
    user: {
      id: u?.id ?? row.user_id ?? 'unknown',
      username: u?.display_name ?? 'Unknown',
      avatarUrl: u?.avatar ?? null,
    },
    content: row.content ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    areaName: row.area_name ?? '',
    distanceMeters: distance,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    replyCount,
    reactionCount: reactions.reduce((sum, r) => sum + r.count, 0),
    reactions,
  };
}

export async function fetchNearbyWhispers(
  lat: number,
  lng: number,
  radius = 500,
): Promise<Whisper[]> {
  ensureConfigured();

  // 1. RPC で近くの whisper ID + 距離を取得
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_whispers', {
    user_lat: lat,
    user_lng: lng,
    radius_meters: radius,
  });

  if (rpcError) throw rpcError;

  const rpcRows = (rpcData ?? []) as Array<{ id: string; distance_meters: number }>;
  if (rpcRows.length === 0) return [];

  const ids = rpcRows.map((r) => r.id);
  const distanceMap = new Map(rpcRows.map((r) => [r.id, r.distance_meters ?? 0]));

  // 2. whisper 本体を取得
  const { data: whisperRows, error: whisperError } = await supabase
    .from('whispers')
    .select('id, user_id, content, latitude, longitude, area_name, created_at, expires_at')
    .in('id', ids);

  if (whisperError) throw whisperError;

  // 2b. ユーザー情報を別途取得
  const userIds = [...new Set((whisperRows ?? []).map((r: any) => r.user_id))];
  const userMap = await fetchUserMap(userIds);

  // 3. リアクション集計を取得
  const { data: reactionRows, error: reactionError } = await supabase
    .from('whisper_reactions')
    .select('whisper_id, reaction_type')
    .in('whisper_id', ids);

  if (reactionError) throw reactionError;

  const reactionMap = new Map<string, ReactionSummary[]>();
  for (const r of reactionRows ?? []) {
    const key = r.whisper_id as string;
    const list = reactionMap.get(key) ?? [];
    const existing = list.find((s) => s.type === r.reaction_type);
    if (existing) {
      existing.count += 1;
    } else {
      list.push({ type: r.reaction_type as ReactionType, count: 1 });
    }
    reactionMap.set(key, list);
  }

  // 4. 返信数を取得
  const { data: replyCountRows, error: replyError } = await supabase
    .from('whisper_replies')
    .select('whisper_id')
    .in('whisper_id', ids);

  if (replyError) throw replyError;

  const replyCountMap = new Map<string, number>();
  for (const r of replyCountRows ?? []) {
    const key = r.whisper_id as string;
    replyCountMap.set(key, (replyCountMap.get(key) ?? 0) + 1);
  }

  // 5. マッピング（RPC の距離順を維持）
  const rowMap = new Map((whisperRows ?? []).map((r: any) => [r.id, r]));
  return ids
    .map((id) => {
      const row = rowMap.get(id);
      if (!row) return null;
      return mapWhisperRow(
        row,
        distanceMap.get(id) ?? 0,
        reactionMap.get(id) ?? [],
        replyCountMap.get(id) ?? 0,
        userMap,
      );
    })
    .filter((w): w is Whisper => w !== null);
}

export async function fetchAllWhispers(): Promise<Whisper[]> {
  ensureConfigured();

  const { data: whisperRows, error: whisperError } = await supabase
    .from('whispers')
    .select('id, user_id, content, latitude, longitude, area_name, created_at, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (whisperError) throw whisperError;
  if (!whisperRows || whisperRows.length === 0) return [];

  const ids = whisperRows.map((r: any) => r.id);
  const userIds = [...new Set(whisperRows.map((r: any) => r.user_id))];
  const userMap = await fetchUserMap(userIds);

  const { data: reactionRows } = await supabase
    .from('whisper_reactions')
    .select('whisper_id, reaction_type')
    .in('whisper_id', ids);

  const reactionMap = new Map<string, ReactionSummary[]>();
  for (const r of reactionRows ?? []) {
    const key = r.whisper_id as string;
    const list = reactionMap.get(key) ?? [];
    const existing = list.find((s) => s.type === r.reaction_type);
    if (existing) {
      existing.count += 1;
    } else {
      list.push({ type: r.reaction_type as ReactionType, count: 1 });
    }
    reactionMap.set(key, list);
  }

  const { data: replyCountRows } = await supabase
    .from('whisper_replies')
    .select('whisper_id')
    .in('whisper_id', ids);

  const replyCountMap = new Map<string, number>();
  for (const r of replyCountRows ?? []) {
    const key = r.whisper_id as string;
    replyCountMap.set(key, (replyCountMap.get(key) ?? 0) + 1);
  }

  return whisperRows.map((row: any) =>
    mapWhisperRow(
      row,
      0,
      reactionMap.get(row.id) ?? [],
      replyCountMap.get(row.id) ?? 0,
      userMap,
    ),
  );
}

export async function createWhisper(
  userId: string,
  content: string,
  lat: number,
  lng: number,
  areaName: string,
): Promise<string> {
  ensureConfigured();

  const { data, error } = await supabase
    .from('whispers')
    .insert({
      user_id: userId,
      content: content.trim(),
      latitude: lat,
      longitude: lng,
      area_name: areaName,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function toggleReaction(
  whisperId: string,
  userId: string,
  type: ReactionType,
): Promise<void> {
  ensureConfigured();

  const { data: existing } = await supabase
    .from('whisper_reactions')
    .select('id')
    .eq('whisper_id', whisperId)
    .eq('user_id', userId)
    .eq('reaction_type', type)
    .maybeSingle();

  if (existing) {
    await supabase.from('whisper_reactions').delete().eq('id', existing.id);
  } else {
    const { error } = await supabase.from('whisper_reactions').insert({
      whisper_id: whisperId,
      user_id: userId,
      reaction_type: type,
    });
    if (error) throw error;
  }
}

export async function fetchReplies(whisperId: string): Promise<WhisperReply[]> {
  ensureConfigured();

  const { data, error } = await supabase
    .from('whisper_replies')
    .select('id, whisper_id, user_id, content, created_at')
    .eq('whisper_id', whisperId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const userIds = [...new Set((data ?? []).map((r: any) => r.user_id))];
  const userMap = await fetchUserMap(userIds);

  return (data ?? []).map((row: any) => {
    const u = userMap.get(row.user_id);
    return {
      id: row.id,
      whisperId: row.whisper_id,
      user: {
        id: u?.id ?? row.user_id ?? 'unknown',
        username: u?.display_name ?? 'Unknown',
        avatarUrl: u?.avatar ?? null,
      },
      content: row.content ?? '',
      createdAt: row.created_at,
    };
  });
}

export async function createReply(
  whisperId: string,
  userId: string,
  content: string,
): Promise<string> {
  ensureConfigured();

  const { data, error } = await supabase
    .from('whisper_replies')
    .insert({
      whisper_id: whisperId,
      user_id: userId,
      content: content.trim(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}
