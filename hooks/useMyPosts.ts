/**
 * ログインユーザーの投稿一覧を取得するフック
 * ProfileScreen の「自分の投稿」セクションで使用
 */
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { formatRelativeTime } from '../lib/utils';
import type { CategoryId } from '../constants/categories';

/** マイページ用の投稿サマリー */
export type MyPostItem = {
  id: string;
  category: CategoryId;
  title: string;
  time: string;
  status: 'active' | 'ended';
  commentCount: number;
};

/**
 * ログインユーザーの投稿一覧を返す
 */
export function useMyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MyPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, category, title, is_ended, created_at, comment_count:comments(count)')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        type Row = {
          id: string;
          category: string;
          title: string;
          is_ended: boolean;
          created_at: string;
          comment_count: Array<{ count: number }>;
        };

        setPosts(
          (data as unknown as Row[]).map((row) => ({
            id: row.id,
            category: row.category as CategoryId,
            title: row.title,
            time: formatRelativeTime(row.created_at),
            status: row.is_ended ? 'ended' : 'active',
            commentCount: row.comment_count[0]?.count ?? 0,
          })),
        );
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return { posts, loading };
}
