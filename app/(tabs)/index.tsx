/**
 * PulseScreen - Pulse（ホーム）画面
 * mock.jsx: view === 'pulse' の画面
 * AI風キーワード検索 → 投稿マッチング表示
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../../types';
import { calcMatchScore } from '../../lib/utils';
import PostListItem from '../../components/post/PostListItem';
import { Colors } from '../../constants/colors';
import { styles } from '../../components/pulse/PulseStyles';

import { usePosts } from '../../hooks/usePosts';

const QUICK_TAGS = ['野菜', '卵', '手伝い', 'イベント', '給付金'];

/**
 * 中央アイコンのパルスアニメーションを管理するフック
 * @returns アニメーション値（scale, opacity）
 */
function usePulseAnimation() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.18, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity]);

  return { scale, opacity };
}

/**
 * Pulse（ホーム）画面
 * NaviOs AI へのキーワード検索と投稿マッチング結果を表示する
 */
export default function PulseScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(Post & { matchScore: number })[]>([]);
  const [searched, setSearched] = useState(false);
  const { scale, opacity } = usePulseAnimation();
  const { posts } = usePosts();

  /** キーワード検索を実行してスコアリング */
  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    // モック: 1秒遅延でスコアリング
    setTimeout(() => {
      const scored = posts
        .map((p) => ({ ...p, matchScore: calcMatchScore(p, query) }))
        .filter((p) => p.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
      setResults(scored);
      setLoading(false);
      setSearched(true);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="flash" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>NaviOs AI</Text>
            <Text style={styles.subtitle}>近くの情報をAIがキャッチ</Text>
          </View>
        </View>
      </View>

      {/* 検索入力 */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="NaviOs AIに聞いてみる..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="search" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* クイックタグ */}
      <View style={styles.tagsRow}>
        {QUICK_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.tag}
            onPress={() => setQuery(tag)}
            activeOpacity={0.7}
          >
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* コンテンツ: ローディング中 */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>近くの情報を探しています...</Text>
        </View>
      )}

      {/* コンテンツ: 検索結果なし */}
      {searched && !loading && results.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="search" size={48} color={Colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>該当する情報が見つかりませんでした</Text>
          <Text style={styles.emptySubText}>別のキーワードで試してみてください</Text>
        </View>
      )}

      {/* コンテンツ: 検索結果あり */}
      {searched && !loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Text style={styles.resultHeader}>{results.length}件見つかりました ✨</Text>
          }
          renderItem={({ item }) => (
            <PostListItem
              post={item}
              onPress={(post) => router.push(`/post/${post.id}`)}
              showMatchScore={item.matchScore}
            />
          )}
        />
      )}

      {/* コンテンツ: 初期状態（中央パルスアイコン） */}
      {!searched && !loading && (
        <View style={styles.center}>
          {/* パルスエフェクト: 固定サイズコンテナでリングをabsoluteFill */}
          <View style={styles.iconWrapper}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
            <View style={styles.aiIconBox}>
              <Ionicons name="flash" size={40} color="#fff" />
            </View>
          </View>

          <Text style={styles.emptyTitle}>NaviOs AIに聞いてみよう</Text>
          <Text style={styles.emptySubText}>
            あなたの言葉で探してみてください。{'\n'}AIが近くの最適な情報を見つけます。
          </Text>
          <View style={styles.hintsRow}>
            {['新鮮な卵が欲しい', '今日のイベント', '誰か手伝って'].map((hint) => (
              <TouchableOpacity
                key={hint}
                style={styles.hint}
                onPress={() => setQuery(hint)}
                activeOpacity={0.7}
              >
                <Text style={styles.hintText}>"{hint}"</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
