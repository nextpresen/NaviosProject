/**
 * ログイン中ユーザーのプロフィール情報を取得するフック
 * users テーブルのデータ + 投稿数・コメント数・協力数を集計
 */
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/** プロフィール表示用の型 */
export type Profile = {
  id: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  email: string;
  stats: { posts: number; helped: number; comments: number };
};

/**
 * ログインユーザーのプロフィールと活動統計を返す
 */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const [userRes, postsRes, helpRes, commentsRes] = await Promise.all([
          supabase.from('users').select('id, display_name, avatar, verified, email').eq('id', user.id).single(),
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id).eq('category', 'help'),
          supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        ]);

        if (userRes.error) throw userRes.error;
        const u = userRes.data as { id: string; display_name: string; avatar: string | null; verified: boolean; email: string };

        setProfile({
          id: u.id,
          displayName: u.display_name,
          avatar: u.avatar ?? u.display_name.charAt(0),
          verified: u.verified,
          email: u.email,
          stats: {
            posts: postsRes.count ?? 0,
            helped: helpRes.count ?? 0,
            comments: commentsRes.count ?? 0,
          },
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return { profile, loading };
}
