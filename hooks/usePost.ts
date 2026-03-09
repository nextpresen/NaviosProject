import { useEffect, useState } from 'react';
import type { Post } from '../types';
import { fetchPostById } from '../lib/postsApi';
import { MOCK_POSTS } from '../lib/mockData';

/**
 * 投稿 ID で単一の投稿を取得するカスタムフック
 * @param id 投稿 UUID
 * @returns 投稿データ・ローディング状態・エラー
 */
export function usePost(id: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPostById(id)
      .then((data) => {
        setPost(data);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '投稿の取得に失敗しました');
        // エラー時はモックにフォールバック
        const fallback = MOCK_POSTS.find((p) => p.id === id) ?? null;
        setPost(fallback);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { post, loading, error };
}
