import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useWhispers } from '../../hooks/useWhispers';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  createWhisper as createWhisperApi,
  toggleReaction as toggleReactionApi,
  fetchReplies,
  createReply as createReplyApi,
} from '../../lib/whisperService';
import {
  MOCK_WHISPERS,
  MOCK_REPLIES,
  MOCK_AREAS,
  REACTION_CONFIG,
  calcWhisperOpacity,
  remainingPercent,
  type Whisper,
  type WhisperReply,
  type ReactionType,
} from '../../types/whisper';

const PURPLE = Colors.purple;
const PURPLE_LIGHT = Colors.purpleLight;

// --- Distance zone config ---
type Zone = 'here' | 'nearby' | 'distant';

const ZONE_CONFIG = {
  here:    { label: '今いるエリア', icon: '📍' as const, color: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)' },
  nearby:  { label: '近くのエリア', icon: '🚶' as const, color: '#F59E0B', bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.15)' },
  distant: { label: 'すこし離れた場所', icon: '🌙' as const, color: '#94A3B8', bg: 'rgba(148,163,184,0.04)', border: 'rgba(148,163,184,0.12)' },
} as const;

function getZone(distance: number): Zone {
  if (distance <= 100) return 'here';
  if (distance <= 400) return 'nearby';
  return 'distant';
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

// --- Card variants by zone ---

function NearCard({ whisper, onPress, replies }: { whisper: Whisper; onPress: () => void; replies?: WhisperReply[] }) {
  const opacity = Math.max(0.3, calcWhisperOpacity(whisper));
  const remaining = remainingPercent(whisper);
  const zone = ZONE_CONFIG.here;

  return (
    <TouchableOpacity style={[styles.cardNear, { opacity, borderLeftColor: zone.color }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarLg, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
          <Text style={[styles.avatarLgText, { color: zone.color }]}>{whisper.user.username.charAt(0)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardUsernameLg}>{whisper.user.username}</Text>
          <View style={styles.cardMetaRow}>
            <View style={[styles.distancePill, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Text style={[styles.distancePillText, { color: zone.color }]}>{formatDistance(whisper.distanceMeters)}</Text>
            </View>
            <Text style={styles.cardMetaText}>{timeAgo(whisper.createdAt)}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.cardMetaText}>{whisper.areaName}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.cardContentLg}>{whisper.content}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.reactionsRow}>
          {whisper.reactions.map((r) => (
            <View key={r.type} style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>{REACTION_CONFIG[r.type].emoji}</Text>
              <Text style={styles.reactionCount}>{r.count}</Text>
            </View>
          ))}
        </View>
        {whisper.replyCount > 0 ? (
          <View style={styles.replyCountBadge}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.replyCountText}>{whisper.replyCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.expiryBar}>
        <View style={[styles.expiryFill, { width: `${remaining}%`, backgroundColor: zone.color }]} />
      </View>

      {replies && replies.length > 0 ? (
        <View style={styles.replyThread}>
          {replies.slice(0, 3).map((r) => (
            <View key={r.id} style={styles.replyItem}>
              <View style={styles.replyAvatar}>
                <Text style={styles.replyAvatarText}>{r.user.username.charAt(0)}</Text>
              </View>
              <View style={styles.replyBody}>
                <Text style={styles.replyUsername}>{r.user.username}</Text>
                <Text style={styles.replyText}>{r.content}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function MidCard({ whisper, onPress }: { whisper: Whisper; onPress: () => void }) {
  const opacity = Math.max(0.25, calcWhisperOpacity(whisper));
  const remaining = remainingPercent(whisper);
  const zone = ZONE_CONFIG.nearby;

  return (
    <TouchableOpacity style={[styles.cardMid, { opacity, borderLeftColor: zone.color }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarMd, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
          <Text style={[styles.avatarMdText, { color: zone.color }]}>{whisper.user.username.charAt(0)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardUsernameMd}>{whisper.user.username}</Text>
            <View style={[styles.distancePillSm, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <Text style={[styles.distancePillSmText, { color: zone.color }]}>{formatDistance(whisper.distanceMeters)}</Text>
            </View>
          </View>
          <Text style={styles.cardMetaTextSm}>{timeAgo(whisper.createdAt)} · {whisper.areaName}</Text>
        </View>
      </View>

      <Text style={styles.cardContentMd}>{whisper.content}</Text>

      <View style={styles.cardFooterCompact}>
        <View style={styles.reactionsRowSm}>
          {whisper.reactions.slice(0, 3).map((r) => (
            <Text key={r.type} style={styles.reactionSm}>{REACTION_CONFIG[r.type].emoji}{r.count}</Text>
          ))}
        </View>
        <View style={styles.expiryBarSm}>
          <View style={[styles.expiryFillSm, { width: `${remaining}%`, backgroundColor: zone.color }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FarCard({ whisper, onPress }: { whisper: Whisper; onPress: () => void }) {
  const opacity = Math.max(0.15, calcWhisperOpacity(whisper));

  return (
    <TouchableOpacity style={[styles.cardFar, { opacity }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.farAvatarDot}>
        <Text style={styles.farAvatarDotText}>{whisper.user.username.charAt(0)}</Text>
      </View>
      <Text style={styles.farContent} numberOfLines={1}>{whisper.content}</Text>
      <Text style={styles.farMeta}>{formatDistance(whisper.distanceMeters)}</Text>
    </TouchableOpacity>
  );
}

// --- Zone section ---

function ZoneSection({ zone, whispers, onSelect, repliesMap }: { zone: Zone; whispers: Whisper[]; onSelect: (w: Whisper) => void; repliesMap?: Map<string, WhisperReply[]> }) {
  const config = ZONE_CONFIG[zone];
  const areaGroups = useMemo(() => {
    const map = new Map<string, Whisper[]>();
    for (const w of whispers) {
      const list = map.get(w.areaName) ?? [];
      list.push(w);
      map.set(w.areaName, list);
    }
    return Array.from(map.entries());
  }, [whispers]);

  return (
    <View style={[styles.zoneSection, { backgroundColor: config.bg }]}>
      <View style={styles.zoneHeader}>
        <Text style={styles.zoneIcon}>{config.icon}</Text>
        <Text style={[styles.zoneLabel, { color: config.color }]}>{config.label}</Text>
        <View style={[styles.zoneCount, { backgroundColor: config.border }]}>
          <Text style={[styles.zoneCountText, { color: config.color }]}>{whispers.length}</Text>
        </View>
      </View>

      {areaGroups.map(([areaName, areaWhispers]) => (
        <View key={areaName} style={styles.areaGroup}>
          {areaGroups.length > 1 ? (
            <View style={styles.areaHeader}>
              <View style={[styles.areaIndicator, { backgroundColor: config.color }]} />
              <Text style={styles.areaName}>{areaName}</Text>
            </View>
          ) : null}

          <View style={styles.zoneCards}>
            {areaWhispers.map((w) => {
              if (zone === 'here') {
                return (
                  <NearCard
                    key={w.id}
                    whisper={w}
                    onPress={() => onSelect(w)}
                    replies={repliesMap?.get(w.id)}
                  />
                );
              }
              if (zone === 'nearby') {
                return <MidCard key={w.id} whisper={w} onPress={() => onSelect(w)} />;
              }
              return <FarCard key={w.id} whisper={w} onPress={() => onSelect(w)} />;
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// --- Detail modal ---

function DetailModal({ whisper, replies, onClose, onReact, onReply }: {
  whisper: Whisper; replies: WhisperReply[]; onClose: () => void; onReact: (type: ReactionType) => void; onReply?: (text: string) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();
  const remaining = remainingPercent(whisper);
  const zone = ZONE_CONFIG[getZone(whisper.distanceMeters)];

  const handleSendReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setSending(true);
    try {
      await onReply(replyText.trim());
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarLg, { backgroundColor: `${zone.color}20` }]}>
                  <Text style={[styles.avatarLgText, { color: zone.color }]}>{whisper.user.username.charAt(0)}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardUsernameLg}>{whisper.user.username}</Text>
                  <View style={styles.cardMetaRow}>
                    <View style={[styles.distancePill, { backgroundColor: `${zone.color}18` }]}>
                      <Text style={[styles.distancePillText, { color: zone.color }]}>{formatDistance(whisper.distanceMeters)}</Text>
                    </View>
                    <Text style={styles.cardMetaText}>{timeAgo(whisper.createdAt)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalContentText}>{whisper.content}</Text>

              <View style={[styles.expiryBar, { marginBottom: 16 }]}>
                <View style={[styles.expiryFill, { width: `${remaining}%`, backgroundColor: zone.color }]} />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reactionPicker}>
                {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => (
                  <TouchableOpacity key={type} style={styles.reactionPickerBtn} onPress={() => onReact(type)} activeOpacity={0.7}>
                    <Text style={styles.reactionPickerEmoji}>{REACTION_CONFIG[type].emoji}</Text>
                    <Text style={styles.reactionPickerLabel}>{REACTION_CONFIG[type].label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalRepliesSection}>
                <Text style={styles.modalRepliesTitle}>返信 ({replies.length})</Text>
                {replies.map((r) => (
                  <View key={r.id} style={styles.replyItem}>
                    <View style={styles.replyAvatar}><Text style={styles.replyAvatarText}>{r.user.username.charAt(0)}</Text></View>
                    <View style={styles.replyBody}>
                      <Text style={styles.replyUsername}>{r.user.username}</Text>
                      <Text style={styles.replyText}>{r.content}</Text>
                      <Text style={styles.replyTime}>{timeAgo(r.createdAt)}</Text>
                    </View>
                  </View>
                ))}
                {replies.length === 0 ? <Text style={styles.noReplies}>まだ返信はありません</Text> : null}
              </View>
            </ScrollView>

            <View style={styles.modalComposeRow}>
              <TextInput style={styles.modalComposeInput} placeholder="返信する..." placeholderTextColor={Colors.textMuted} value={replyText} onChangeText={setReplyText} editable={!sending} />
              <TouchableOpacity style={[styles.modalComposeBtn, (!replyText.trim() || sending) && { opacity: 0.4 }]} disabled={!replyText.trim() || sending} onPress={handleSendReply}>
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// --- Main screen ---

export default function TalkScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();
  const useMock = !isSupabaseConfigured;

  const {
    whispers: remoteWhispers,
    loading: whispersLoading,
    error: whispersError,
    refetch,
  } = useWhispers(useMock ? null : coords ?? null);

  const [localWhispers, setLocalWhispers] = useState(MOCK_WHISPERS);
  const whispers = useMock ? localWhispers : remoteWhispers;

  const [selectedWhisper, setSelectedWhisper] = useState<Whisper | null>(null);
  const [composeText, setComposeText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [modalReplies, setModalReplies] = useState<WhisperReply[]>([]);
  const [modalRepliesLoading, setModalRepliesLoading] = useState(false);
  const [composing, setComposing] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // 選択したウィスパーの返信を取得
  useEffect(() => {
    if (!selectedWhisper) {
      setModalReplies([]);
      return;
    }
    if (useMock) {
      setModalReplies(MOCK_REPLIES.filter((r) => r.whisperId === selectedWhisper.id));
      return;
    }
    setModalRepliesLoading(true);
    fetchReplies(selectedWhisper.id)
      .then(setModalReplies)
      .catch(() => setModalReplies([]))
      .finally(() => setModalRepliesLoading(false));
  }, [selectedWhisper, useMock]);

  const grouped = useMemo(() => {
    const sorted = [...whispers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const here: Whisper[] = [];
    const nearby: Whisper[] = [];
    const distant: Whisper[] = [];
    for (const w of sorted) {
      const z = getZone(w.distanceMeters);
      if (z === 'here') here.push(w);
      else if (z === 'nearby') nearby.push(w);
      else distant.push(w);
    }
    return { here, nearby, distant };
  }, [whispers]);

  const handleCompose = async () => {
    if (!composeText.trim() || !user) return;

    if (useMock) {
      const newWhisper: Whisper = {
        id: `w-new-${Date.now()}`,
        user: { id: user.id, username: user.email?.split('@')[0] ?? 'You', avatarUrl: null },
        content: composeText.trim(),
        latitude: coords?.latitude ?? 35.6581,
        longitude: coords?.longitude ?? 139.7017,
        areaName: '',
        distanceMeters: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        replyCount: 0,
        reactionCount: 0,
        reactions: [],
      };
      setLocalWhispers((prev) => [newWhisper, ...prev]);
      setComposeText('');
      showToast('つぶやきました');
      return;
    }

    setComposing(true);
    try {
      await createWhisperApi(
        user.id,
        composeText.trim(),
        coords?.latitude ?? 0,
        coords?.longitude ?? 0,
        '',
      );
      setComposeText('');
      showToast('つぶやきました');
      refetch();
    } catch {
      showToast('送信に失敗しました');
    } finally {
      setComposing(false);
    }
  };

  const handleReact = async (type: ReactionType) => {
    if (!selectedWhisper || !user) return;

    if (useMock) {
      setLocalWhispers((prev) =>
        prev.map((w) => {
          if (w.id !== selectedWhisper.id) return w;
          const existing = w.reactions.find((r) => r.type === type);
          const reactions = existing
            ? w.reactions.map((r) => (r.type === type ? { ...r, count: r.count + 1 } : r))
            : [...w.reactions, { type, count: 1 }];
          return { ...w, reactions, reactionCount: w.reactionCount + 1 };
        }),
      );
      showToast(`${REACTION_CONFIG[type].emoji} ${REACTION_CONFIG[type].label}`);
      setSelectedWhisper(null);
      return;
    }

    try {
      await toggleReactionApi(selectedWhisper.id, user.id, type);
      showToast(`${REACTION_CONFIG[type].emoji} ${REACTION_CONFIG[type].label}`);
      setSelectedWhisper(null);
      refetch();
    } catch {
      showToast('リアクションに失敗しました');
    }
  };

  const handleModalReply = async (text: string) => {
    if (!selectedWhisper || !user || !text.trim()) return;

    if (useMock) return;

    try {
      await createReplyApi(selectedWhisper.id, user.id, text);
      const updated = await fetchReplies(selectedWhisper.id);
      setModalReplies(updated);
      refetch();
    } catch {
      showToast('返信に失敗しました');
    }
  };

  const hasWhispers = grouped.here.length + grouped.nearby.length + grouped.distant.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.radarDot}>
              <View style={styles.radarDotInner} />
            </View>
            <View>
              <Text style={styles.headerLocation}>渋谷駅周辺</Text>
              <Text style={styles.headerRange}>半径500m のつぶやき</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.activeDot} />
            <Text style={styles.headerPeople}>{whispers.length}件のつぶやき</Text>
          </View>
        </View>

        {/* Feed */}
        <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {whispersLoading && !useMock ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={PURPLE} />
              <Text style={styles.emptyText}>つぶやきを取得中...</Text>
            </View>
          ) : whispersError && !useMock ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>!</Text>
              <Text style={styles.emptyText}>{whispersError}</Text>
              <TouchableOpacity onPress={refetch} style={styles.retryBtn} activeOpacity={0.7}>
                <Text style={styles.retryText}>再試行</Text>
              </TouchableOpacity>
            </View>
          ) : !hasWhispers ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🤫</Text>
              <Text style={styles.emptyText}>このエリアにはまだつぶやきがありません。{'\n'}最初のつぶやきを投稿してみましょう！</Text>
            </View>
          ) : (
            <>
              {grouped.here.length > 0 ? <ZoneSection zone="here" whispers={grouped.here} onSelect={setSelectedWhisper} /> : null}
              {grouped.nearby.length > 0 ? <ZoneSection zone="nearby" whispers={grouped.nearby} onSelect={setSelectedWhisper} /> : null}
              {grouped.distant.length > 0 ? <ZoneSection zone="distant" whispers={grouped.distant} onSelect={setSelectedWhisper} /> : null}
            </>
          )}
        </ScrollView>

        {/* Compose bar / Login prompt */}
        {user ? (
          <View style={[styles.composeBar, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={styles.composeInput}
              placeholder="つぶやく..."
              placeholderTextColor={Colors.textMuted}
              value={composeText}
              onChangeText={setComposeText}
              onSubmitEditing={handleCompose}
              returnKeyType="send"
              editable={!composing}
            />
            <TouchableOpacity
              style={[styles.composeBtn, (!composeText.trim() || composing) && { opacity: 0.4 }]}
              onPress={handleCompose}
              disabled={!composeText.trim() || composing}
              activeOpacity={0.8}
            >
              {composing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.loginBar, { paddingBottom: insets.bottom + 8 }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={18} color={PURPLE} />
            <Text style={styles.loginBarText}>ログインしてつぶやきに参加する</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {selectedWhisper ? (
        <DetailModal whisper={selectedWhisper} replies={modalReplies} onClose={() => setSelectedWhisper(null)} onReact={handleReact} onReply={handleModalReply} />
      ) : null}

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}
    </View>
  );
}

// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFE' },
  safeArea: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radarDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },
  radarDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  headerLocation: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  headerRange: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  headerPeople: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  // Feed
  feed: { flex: 1 },
  feedContent: { paddingBottom: 8 },

  // Zone section
  zoneSection: { paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  zoneIcon: { fontSize: 14 },
  zoneLabel: { fontSize: 13, fontWeight: '700' },
  zoneCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  zoneCountText: { fontSize: 10, fontWeight: '700' },

  // Area group
  areaGroup: { gap: 6 },
  areaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, marginBottom: 2 },
  areaIndicator: { width: 4, height: 4, borderRadius: 2 },
  areaName: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  areaUserCount: { fontSize: 10, color: Colors.textMuted },
  zoneCards: { gap: 8 },

  // === NEAR card (large, full detail) ===
  cardNear: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },

  // === MID card (medium, condensed) ===
  cardMid: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 12, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },

  // === FAR card (compact one-liner) ===
  cardFar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  farAvatarDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  farAvatarDotText: { fontSize: 9, fontWeight: '700', color: Colors.textMuted },
  farContent: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  farMeta: { fontSize: 10, color: Colors.textMuted },

  // Shared card elements
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMeta: { flex: 1, gap: 3 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 11, color: Colors.textMuted },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted },

  // Near avatar
  avatarLg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarLgText: { fontSize: 16, fontWeight: '800' },
  cardUsernameLg: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardContentLg: { fontSize: 16, lineHeight: 24, color: Colors.textPrimary },
  distancePill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  distancePillText: { fontSize: 10, fontWeight: '700' },

  // Mid avatar
  avatarMd: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarMdText: { fontSize: 13, fontWeight: '700' },
  cardUsernameMd: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cardMetaTextSm: { fontSize: 10, color: Colors.textMuted },
  cardContentMd: { fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  distancePillSm: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 },
  distancePillSmText: { fontSize: 9, fontWeight: '700' },

  // Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardFooterCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reactionsRow: { flexDirection: 'row', gap: 6 },
  reactionsRowSm: { flexDirection: 'row', gap: 6 },
  reactionBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  reactionEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  reactionSm: { fontSize: 11, color: Colors.textSecondary },
  replyCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  replyCountText: { fontSize: 11, color: Colors.textMuted },

  // Expiry bar
  expiryBar: { height: 3, backgroundColor: Colors.surfaceSecondary, borderRadius: 2, overflow: 'hidden' },
  expiryFill: { height: '100%', borderRadius: 2 },
  expiryBarSm: { flex: 1, height: 2, backgroundColor: Colors.surfaceSecondary, borderRadius: 1, overflow: 'hidden' },
  expiryFillSm: { height: '100%', borderRadius: 1 },

  // Reply thread
  replyThread: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingTop: 10, gap: 8 },
  replyItem: { flexDirection: 'row', gap: 8 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  replyAvatarText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  replyBody: { flex: 1, gap: 2 },
  replyUsername: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  replyText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  replyTime: { fontSize: 10, color: Colors.textMuted },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: PURPLE, borderRadius: 16, marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Compose bar
  composeBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  composeInput: { flex: 1, height: 44, backgroundColor: Colors.surfaceSecondary, borderRadius: 22, paddingHorizontal: 16, fontSize: 14, color: Colors.textPrimary },
  composeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },

  // Login bar (guest)
  loginBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  loginBarText: { fontSize: 14, fontWeight: '600', color: PURPLE },

  // Detail modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { maxHeight: '85%' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 8 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 12 },
  modalScroll: { maxHeight: 500 },
  modalContentText: { fontSize: 17, lineHeight: 26, color: Colors.textPrimary, marginVertical: 12 },
  reactionPicker: { marginBottom: 16 },
  reactionPickerBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.surfaceSecondary, borderRadius: 16, marginRight: 8 },
  reactionPickerEmoji: { fontSize: 22 },
  reactionPickerLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  modalRepliesSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, gap: 10, marginBottom: 12 },
  modalRepliesTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  noReplies: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  modalComposeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  modalComposeInput: { flex: 1, height: 40, backgroundColor: Colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: 14, fontSize: 14, color: Colors.textPrimary },
  modalComposeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },

  // Toast
  toast: { position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  toastText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
