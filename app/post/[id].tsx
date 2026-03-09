/**
 * DetailScreen - 投稿詳細画面
 * mock.jsx: view === 'detail' の画面
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Linking,
  Share,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import UserAvatar from '../../components/common/UserAvatar';
import CategoryBadge from '../../components/common/CategoryBadge';
import CategoryDetailCard from '../../components/post/CategoryDetailCard';
import CommentItem from '../../components/post/CommentItem';
import { formatDistance, getWalkTime } from '../../lib/utils';
import { CATEGORY_ACTIONS } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import { MOCK_COMMENTS } from '../../lib/mockData';
import { usePost } from '../../hooks/usePost';
import { styles } from '../../components/post/PostDetailStyles';

const PAGE_SIZE = 3;

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { post, loading: postLoading } = usePost(id ?? '');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (post) setLikeCount(post.likeCount ?? 0);
  }, [post]);

  if (postLoading) return null;
  if (!post) return null;
  const comments = MOCK_COMMENTS.slice(0, visibleCount);
  const remaining = MOCK_COMMENTS.length - visibleCount;
  const action = CATEGORY_ACTIONS[post.category];

  const handleNavigate = () => {
    const { latitude, longitude } = post.place;
    const url = `https://maps.google.com/?daddr=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => n + (next ? 1 : -1));
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1,   duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleShare = () => {
    Share.share({
      title: post.title,
      message: `${post.title}\n${post.place.name} - ${post.place.address}`,
    }).catch(() => {});
  };

  const handleActionPress = () => {
    if (post.category === 'stock' && post.author.phone) {
      Linking.openURL(`tel:${post.author.phone}`).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <CategoryBadge categoryId={post.category} />
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 画像 */}
        {post.images.length > 0 && (
          <Image source={{ uri: post.images[0] }} style={styles.image} />
        )}

        <View style={styles.body}>
          {/* タイトル・投稿者 */}
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.authorRow}>
            <UserAvatar avatar={post.author.avatar} size={32} />
            <View>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{post.author.displayName}</Text>
                {post.author.verified && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.time}>{post.createdAt}</Text>
            </View>
          </View>

          {/* いいね・コメント数 */}
          <View style={styles.engagementRow}>
            <TouchableOpacity style={styles.engagementBtn} onPress={handleLike} activeOpacity={0.7}>
              <Animated.View style={[styles.likeIcon, { transform: [{ scale: likeScale }] }]}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={liked ? '#F43F5E' : Colors.textSecondary}
                />
              </Animated.View>
              <Text style={[styles.engagementCount, liked && styles.engagementCountLiked]}>
                {likeCount}
              </Text>
              <Text style={styles.engagementLabel}>いいね</Text>
            </TouchableOpacity>
            <View style={styles.engagementDivider} />
            <View style={styles.engagementBtn}>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.engagementCount}>{post.commentCount}</Text>
              <Text style={styles.engagementLabel}>コメント</Text>
            </View>
            <View style={styles.engagementDivider} />
            <TouchableOpacity style={styles.engagementBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.engagementLabel}>シェア</Text>
            </TouchableOpacity>
          </View>

          {/* 場所情報 */}
          <View style={styles.placeCard}>
            <View style={styles.placeIconBox}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{post.place.name}</Text>
              <Text style={styles.placeAddress}>{post.place.address}</Text>
            </View>
            <View style={styles.placeDistance}>
              <Text style={[styles.distanceText, { color: Colors.primary }]}>
                {formatDistance(post.distance)}
              </Text>
              <Text style={styles.walkText}>{getWalkTime(post.distance)}</Text>
            </View>
          </View>

          {/* 本文 */}
          <Text style={styles.content}>{post.content}</Text>

          {/* カテゴリ別詳細 */}
          <CategoryDetailCard post={post} />

          {/* コメント */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsTitleRow}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.textPrimary} />
              <Text style={styles.commentsTitle}>コメント ({MOCK_COMMENTS.length})</Text>
            </View>
            <View style={styles.commentList}>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </View>
            {remaining > 0 && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                <Text style={styles.loadMoreText}>もっと見る（残り{remaining}件）</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* コメント入力 + アクションボタン */}
      <View style={styles.footer}>
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="コメントを入力..."
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.navButton} onPress={handleNavigate}>
            <Ionicons name="navigate-outline" size={16} color={Colors.textPrimary} />
            <Text style={styles.navButtonText}>ここへ行く</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={handleActionPress}
          >
            <Text style={styles.actionButtonText}>{action.label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

