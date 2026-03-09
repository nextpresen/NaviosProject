/**
 * 自分の投稿カード（公開中/終了済みタブ切り替え + 投稿リスト）
 */
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryBadge from '../common/CategoryBadge';
import { Colors } from '../../constants/colors';
import type { CategoryId } from '../../constants/categories';
import type { MyPostItem } from '../../hooks/useMyPosts';

type PostTab = 'active' | 'ended';

type Props = {
  /** 公開中の投稿 */
  activePosts: MyPostItem[];
  /** 終了済みの投稿 */
  endedPosts: MyPostItem[];
  /** 現在のタブ */
  postTab: PostTab;
  /** タブ切り替えコールバック */
  onTabChange: (tab: PostTab) => void;
  /** 投稿タップコールバック */
  onPostPress: (id: string) => void;
  /** ローディング中か */
  loading: boolean;
};

/** 自分の投稿セクション */
export default function MyPostsCard({
  activePosts,
  endedPosts,
  postTab,
  onTabChange,
  onPostPress,
  loading,
}: Props) {
  const displayPosts = postTab === 'active' ? activePosts : endedPosts;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="document-text-outline" size={16} color={Colors.textPrimary} />
        <Text style={styles.title}>自分の投稿</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, postTab === 'active' && styles.tabActive]}
          onPress={() => onTabChange('active')}
        >
          <Text style={[styles.tabText, postTab === 'active' && styles.tabTextActive]}>
            公開中 ({activePosts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, postTab === 'ended' && styles.tabEnded]}
          onPress={() => onTabChange('ended')}
        >
          <Text style={[styles.tabText, postTab === 'ended' && styles.tabTextEnded]}>
            終了済み ({endedPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
        ) : displayPosts.length === 0 ? (
          <Text style={styles.empty}>
            {postTab === 'active' ? '公開中の投稿はありません' : '終了済みの投稿はありません'}
          </Text>
        ) : (
          displayPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={[styles.item, post.status === 'ended' && styles.itemEnded]}
              onPress={() => onPostPress(post.id)}
            >
              <CategoryBadge categoryId={post.category as CategoryId} size="sm" />
              <View style={styles.body}>
                <Text
                  style={[styles.postTitle, post.status === 'ended' && styles.postTitleEnded]}
                  numberOfLines={1}
                >
                  {post.title}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{post.time}</Text>
                  <View style={styles.metaStat}>
                    <Ionicons name="chatbubble-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.meta}>{post.commentCount}</Text>
                  </View>
                </View>
              </View>
              {post.status === 'ended' && (
                <View style={styles.endedBadge}>
                  <Text style={styles.endedText}>終了</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const CARD = { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 } as const;

const styles = StyleSheet.create({
  card: CARD,
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabEnded: { backgroundColor: '#475569' },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  tabTextEnded: { color: '#fff' },
  list: { gap: 8 },
  loader: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  itemEnded: { backgroundColor: Colors.surfaceSecondary },
  body: { flex: 1, gap: 4 },
  postTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  postTitleEnded: { color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 11, color: Colors.textMuted },
  metaStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  endedBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#E2E8F0', borderRadius: 6 },
  endedText: { fontSize: 11, color: Colors.textSecondary },
  empty: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', padding: 16 },
});
