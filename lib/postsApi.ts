/**
 * postsApi.ts - Supabase 投稿取得・作成ロジック
 * DB レスポンス型・マッピング・フェッチ・作成関数を集約する
 */
import { supabase } from './supabase';
import type { Post, PostDetails, PostFormData } from '../types';
import type { CategoryId } from '../constants/categories';
import { formatRelativeTime } from './utils';

// ─── DB レスポンス型 ────────────────────────────────────────────────

type DbAuthor = {
  id: string;
  display_name: string;
  avatar: string | null;
  verified: boolean;
  phone: string | null;
};

type DbPlace = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

type DbPostDetails = {
  price: string | null;
  stock_status: string | null;
  stock_duration: string | null;
  event_date: string | null;
  event_time: string | null;
  fee: string | null;
  max_participants: number | null;
  current_participants: number | null;
  help_type: string | null;
  reward: string | null;
  estimated_time: string | null;
  deadline: string | null;
  requirements: string[] | null;
};

export type DbPost = {
  id: string;
  category: string;
  title: string;
  content: string | null;
  allow_comments: boolean;
  expires_at: string | null;
  is_ended: boolean;
  created_at: string;
  author: DbAuthor | null;
  place: DbPlace | null;
  details: DbPostDetails | null;
  images: Array<{ image_url: string; display_order: number }>;
  comment_count: Array<{ count: number }>;
};

/** posts テーブルの SELECT 句（全画面共通） */
const POST_SELECT = `
  id, category, title, content, allow_comments, expires_at, is_ended, created_at,
  author:users!author_id(id, display_name, avatar, verified, phone),
  place:places!place_id(id, name, address, latitude, longitude),
  details:post_details(*),
  images:post_images(image_url, display_order),
  comment_count:comments(count)
`;

// ─── マッピング ─────────────────────────────────────────────────────

/** DB の post_details → PostDetails 型 */
const mapDbDetails = (d: DbPostDetails): PostDetails => ({
  price: d.price ?? undefined,
  stockStatus: (d.stock_status as PostDetails['stockStatus']) ?? undefined,
  stockDuration: (d.stock_duration as PostDetails['stockDuration']) ?? undefined,
  eventDate: d.event_date ?? undefined,
  eventTime: d.event_time ?? undefined,
  fee: d.fee ?? undefined,
  maxParticipants: d.max_participants ?? undefined,
  currentParticipants: d.current_participants ?? undefined,
  helpType: (d.help_type as PostDetails['helpType']) ?? undefined,
  reward: d.reward ?? undefined,
  estimatedTime: d.estimated_time ?? undefined,
  deadline: d.deadline ?? undefined,
  requirements: d.requirements ?? undefined,
});

/**
 * DbPost → Post 型に変換する
 * @param dbPost DB レコード
 * @param distanceMeters 現在地からの距離（メートル）
 */
export const mapDbPostToPost = (dbPost: DbPost, distanceMeters: number): Post => ({
  id: dbPost.id,
  category: dbPost.category as CategoryId,
  title: dbPost.title,
  content: dbPost.content ?? '',
  author: {
    id: dbPost.author?.id ?? '',
    displayName: dbPost.author?.display_name ?? '不明',
    avatar: dbPost.author?.avatar ?? '?',
    verified: dbPost.author?.verified ?? false,
    phone: dbPost.author?.phone ?? null,
  },
  place: {
    id: dbPost.place?.id,
    name: dbPost.place?.name ?? '不明',
    address: dbPost.place?.address ?? '',
    latitude: dbPost.place?.latitude ?? 0,
    longitude: dbPost.place?.longitude ?? 0,
  },
  distance: Math.round(distanceMeters),
  images: [...dbPost.images]
    .sort((a, b) => a.display_order - b.display_order)
    .map((i) => i.image_url),
  details: dbPost.details ? mapDbDetails(dbPost.details) : undefined,
  allowComments: dbPost.allow_comments,
  isEnded: dbPost.is_ended,
  commentCount: dbPost.comment_count[0]?.count ?? 0,
  createdAt: formatRelativeTime(dbPost.created_at),
  expiresAt: dbPost.expires_at ?? undefined,
});

// ─── フェッチ関数 ──────────────────────────────────────────────────

type RpcRow = { id: string; distance_meters: number };

/**
 * 現在地から半径 radius_meters 以内の投稿を取得する
 * @param lat 緯度
 * @param lng 経度
 * @param radiusMeters 取得半径（メートル）
 */
export const fetchNearbyPosts = async (
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<Post[]> => {
  // Step 1: RPC で近隣の投稿 ID + 距離を取得
  const { data: nearbyData, error: rpcError } = await supabase.rpc('get_nearby_posts', {
    user_lat: lat,
    user_lng: lng,
    radius_meters: radiusMeters,
    category_filter: null,
  });
  if (rpcError) throw rpcError;
  if (!nearbyData || (nearbyData as RpcRow[]).length === 0) return [];

  const distanceMap = new Map<string, number>(
    (nearbyData as RpcRow[]).map((r) => [r.id, r.distance_meters]),
  );

  // Step 2: 投稿詳細を JOIN クエリで取得
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('id', [...distanceMap.keys()]);
  if (postsError) throw postsError;
  if (!postsData) return [];

  // Step 3: Post 型にマップして距離順ソート
  return (postsData as unknown as DbPost[])
    .map((dbPost) => mapDbPostToPost(dbPost, distanceMap.get(dbPost.id) ?? 0))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * 投稿 ID で単一の投稿を取得する
 * @param id 投稿 UUID
 */
export const fetchPostById = async (id: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!data) return null;
  return mapDbPostToPost(data as unknown as DbPost, 0);
};

// ─── 投稿作成 ──────────────────────────────────────────────────────

/**
 * フォームデータから expires_at を計算する
 */
const calcExpiresAt = (form: PostFormData): string | null => {
  const now = new Date();
  switch (form.category) {
    case 'stock': {
      if (!form.stockDuration || form.stockDuration === 'manual') return null;
      const daysMap: Record<string, number> = { today: 0, '48hours': 2, '3days': 3, '1week': 7 };
      const days = daysMap[form.stockDuration];
      const d = new Date(now);
      if (days === 0) {
        d.setHours(23, 59, 59, 999);
      } else {
        d.setDate(d.getDate() + days);
      }
      return d.toISOString();
    }
    case 'event':
      return form.eventDate ? `${form.eventDate}T23:59:59+09:00` : null;
    case 'help': {
      const d = new Date(now);
      d.setHours(d.getHours() + 48);
      return d.toISOString();
    }
    case 'admin':
      return form.deadline ? `${form.deadline}T23:59:59+09:00` : null;
    default:
      return null;
  }
};

/**
 * ローカル URI の画像を Supabase Storage にアップロードし公開 URL を返す
 * @param localUris expo-image-picker が返したローカル URI の配列
 */
const uploadPostImages = async (localUris: string[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const uri of localUris) {
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, blob, { contentType: `image/${ext}` });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
    urls.push(urlData.publicUrl);
  }
  return urls;
};

/**
 * 投稿を DB に保存する
 * places → posts → post_details → post_images の順で insert する
 * @param form 投稿作成フォームデータ
 * @param authorId 投稿者の user UUID
 * @returns 作成した投稿の UUID
 */
export const createPost = async (form: PostFormData, authorId: string): Promise<string> => {
  // 1. 場所の upsert
  let placeId: string | null = null;
  if (form.place) {
    if (form.place.id) {
      placeId = form.place.id;
    } else {
      const { data: placeData, error: placeError } = await supabase
        .from('places')
        .insert({
          name: form.place.name,
          address: form.place.address || null,
          latitude: form.place.latitude,
          longitude: form.place.longitude,
          source: 'user',
        })
        .select('id')
        .single();
      if (placeError) throw placeError;
      placeId = (placeData as { id: string }).id;
    }
  }

  // 2. posts insert
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      category: form.category,
      title: form.title.trim(),
      content: form.content?.trim() || null,
      place_id: placeId,
      location: form.place
        ? `SRID=4326;POINT(${form.place.longitude} ${form.place.latitude})`
        : null,
      allow_comments: form.allowComments,
      expires_at: calcExpiresAt(form),
    })
    .select('id')
    .single();
  if (postError) throw postError;
  const postId = (postData as { id: string }).id;

  // 3. post_details insert
  const { error: detailsError } = await supabase.from('post_details').insert({
    post_id: postId,
    price: form.price || null,
    stock_status: form.stockStatus || null,
    stock_duration: form.stockDuration || null,
    event_date: form.eventDate || null,
    event_time: form.eventTime || null,
    fee: form.fee || null,
    max_participants: form.maxParticipants ?? null,
    help_type: form.helpType || null,
    reward: form.reward || null,
    estimated_time: form.estimatedTime || null,
    deadline: form.deadline || null,
    requirements: form.requirements?.filter(Boolean).length ? form.requirements : null,
  });
  if (detailsError) throw detailsError;

  // 4. 画像アップロード → post_images insert
  if (form.images.length > 0) {
    const uploadedUrls = await uploadPostImages(form.images);
    const { error: imagesError } = await supabase.from('post_images').insert(
      uploadedUrls.map((url, i) => ({ post_id: postId, image_url: url, display_order: i })),
    );
    if (imagesError) throw imagesError;
  }

  return postId;
};
