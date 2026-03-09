/**
 * NearbyScreen - 近く（地図）画面
 * mock.jsx: view === 'main' の画面
 * 地図 + ボトムシート（ホットカード / 投稿リスト）
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
} from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CategoryId, getCategoryInfo, getCategoryIconName } from '../../constants/categories';
import { Post } from '../../types';
import CategoryFilter from '../../components/common/CategoryFilter';
import PostCard from '../../components/post/PostCard';
import PostListItem from '../../components/post/PostListItem';
import { Colors } from '../../constants/colors';
import { usePosts } from '../../hooks/usePosts';
import { useLocation } from '../../hooks/useLocation';
import { styles, SHEET_TRANSLATE } from '../../components/nearby/NearbyStyles';

/** PostCard の幅(160) + marginRight(12) */
const CARD_WIDTH = 172;
type SheetState = 'closed' | 'half' | 'full';

/** mock.jsx の pinPositions と同じ配置 */
const PIN_POSITIONS = [
  { top: '22%', left: '25%' },
  { top: '30%', left: '68%' },
  { top: '58%', left: '20%' },
  { top: '65%', left: '72%' },
  { top: '18%', left: '50%' },
  { top: '48%', left: '40%' },
  { top: '75%', left: '45%' },
  { top: '38%', left: '30%' },
] as const;

/**
 * 近く画面 - 地図とボトムシートで近隣投稿を表示
 */
export default function NearbyScreen() {
  const router = useRouter();
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>(
    (initialCategory as CategoryId) ?? 'all'
  );
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { coords } = useLocation();
  const { posts } = usePosts(coords);
  const hotCardsRef = useRef<ScrollViewType>(null);

  // ─── ロゴ点滅アニメーション ───────────────────────────
  const dotOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [dotOpacity]);

  // ─── 現在地マーカーの ping アニメーション ────────────
  const pingScale   = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const ping = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pingScale,   { toValue: 2.4, duration: 1400, useNativeDriver: true }),
          Animated.timing(pingOpacity, { toValue: 0,   duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pingScale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(pingOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    ping.start();
    return () => ping.stop();
  }, [pingScale, pingOpacity]);

  // ─── ボトムシートの translateY アニメーション ─────────
  const sheetTranslateY = useRef(new Animated.Value(SHEET_TRANSLATE['half'])).current;

  /** シートの状態変更 + アニメーション */
  const animateSheet = (next: SheetState) => {
    setSheetState(next);
    Animated.timing(sheetTranslateY, {
      toValue: SHEET_TRANSLATE[next],
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  /** シート状態を closed → half → full → half と切り替える */
  const cycleSheet = () => {
    const next: SheetState =
      sheetState === 'closed' ? 'half' : sheetState === 'half' ? 'full' : 'half';
    animateSheet(next);
  };

  // ─── データ ─────────────────────────────────────────
  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter((p) => p.category === activeCategory);
  const sorted   = [...filtered].sort((a, b) => a.distance - b.distance);
  const hotPosts = sorted.slice(0, 3);

  const categoryCount = Object.fromEntries(
    (['stock', 'event', 'help', 'admin'] as CategoryId[]).map((id) => [
      id,
      posts.filter((p) => p.category === id).length,
    ])
  ) as Record<CategoryId, number>;

  return (
    <View style={styles.container}>
      {/* 地図エリア（プレースホルダー） */}
      <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map Placeholder</Text>
          <Text style={styles.mapSubText}>地図は準備中です</Text>

          <View style={styles.locationMarker}>
            <Animated.View style={[
              styles.locationPing,
              { transform: [{ scale: pingScale }], opacity: pingOpacity },
            ]} />
            <View style={styles.locationDot}>
              <Ionicons name="navigate" size={14} color="#fff" />
            </View>
          </View>

          {sorted.slice(0, PIN_POSITIONS.length).map((post, i) => {
            const cat = getCategoryInfo(post.category);
            const iconName = getCategoryIconName(post.category) as keyof typeof Ionicons.glyphMap;
            const pos = PIN_POSITIONS[i];
            const isSelected = selectedPost?.id === post.id;
            return (
              <TouchableOpacity
                key={post.id}
                style={[styles.pin, { top: pos.top, left: pos.left }]}
                onPress={() => {
                  setSelectedPost(post);
                  if (sheetState === 'closed') animateSheet('half');
                  const hotIndex = hotPosts.findIndex((hp) => hp.id === post.id);
                  if (hotIndex >= 0) {
                    hotCardsRef.current?.scrollTo({ x: hotIndex * CARD_WIDTH, animated: true });
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.pinCircle,
                  { backgroundColor: cat.color },
                  isSelected && styles.pinCircleSelected,
                ]}>
                  <Ionicons name={iconName} size={16} color="#fff" />
                </View>
                {post.urgency === 'high' && (
                  <View style={styles.pinUrgency}>
                    <Text style={styles.pinUrgencyText}>!</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
      </View>

      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
            <Text style={styles.logoText}>NaviOs</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.locationChip}>
              <Ionicons name="location-sharp" size={12} color={Colors.primary} />
              <Text style={styles.locationText}>伊集院</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications" size={18} color={Colors.textPrimary} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* カテゴリフィルター */}
        <CategoryFilter
          active={activeCategory}
          onSelect={setActiveCategory}
          counts={categoryCount}
        />
      </SafeAreaView>

      {/* ボトムシート（translateY アニメーション） */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        {/* ハンドル */}
        <TouchableOpacity style={styles.handleArea} onPress={cycleSheet}>
          <View style={styles.handle} />
        </TouchableOpacity>

        {sheetState === 'closed' ? (
          <View style={styles.closedRow}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>近くの今</Text>
              <Text style={styles.countText}>{sorted.length}件</Text>
            </View>
            <Ionicons name="chevron-up" size={16} color={Colors.textMuted} />
          </View>
        ) : (
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDotWhite} />
                <Text style={styles.liveBadgeText}>近くの今</Text>
              </View>
              <Text style={styles.countTextSub}>{sorted.length}件の情報</Text>
            </View>

            {/* ホットカード（横スクロール） */}
            <View style={styles.hotCardsWrapper}>
              <ScrollView
                ref={hotCardsRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hotCards}
              >
                {hotPosts.map((post) => (
                  <View key={post.id} style={styles.hotCardItem}>
                    <PostCard
                      post={post}
                      isSelected={selectedPost?.id === post.id}
                      onPress={(p) => {
                        setSelectedPost(p);
                        router.push(`/post/${p.id}`);
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 全リスト（full時のみ） */}
            {sheetState === 'full' && (
              <FlatList
                style={styles.fullList}
                data={sorted}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                renderItem={({ item }) => (
                  <PostListItem post={item} onPress={(p) => router.push(`/post/${p.id}`)} />
                )}
              />
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}
