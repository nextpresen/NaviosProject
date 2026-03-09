import { useEffect, useState } from 'react';
import type { Post } from '../types';
import { fetchNearbyPosts } from '../lib/postsApi';
import { MOCK_POSTS } from '../lib/mockData';

/** 投稿取得半径（1km） */
const RADIUS_METERS = 1000;

/**
 * 近隣の投稿一覧を取得するカスタムフック
 * @param coords 現在地の座標。未指定・null の場合はモックデータを返す
 * @returns 投稿リスト・ローディング状態・エラー
 */
export function usePosts(
  coords?: { latitude: number; longitude: number } | null,
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // coords 未指定または null → モックを即時返す
    if (!coords) {
      setPosts(MOCK_POSTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchNearbyPosts(coords.latitude, coords.longitude, RADIUS_METERS)
      .then((data) => {
        setPosts(data);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '投稿の取得に失敗しました');
        setPosts(MOCK_POSTS); // エラー時はモックにフォールバック
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.latitude, coords?.longitude]);

  return { posts, loading, error };
}
