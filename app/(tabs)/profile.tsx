/**
 * ProfileScreen - マイページ
 * Supabase からログインユーザーの情報・投稿を取得して表示する
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { signOut } from '../../lib/auth';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useMyPosts } from '../../hooks/useMyPosts';
import ProfileCard from '../../components/profile/ProfileCard';
import MyPostsCard from '../../components/profile/MyPostsCard';

type PostTab = 'active' | 'ended';

type SettingItem = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
};

const SETTING_ITEMS: SettingItem[] = [
  { iconName: 'notifications-outline', label: '通知設定', sub: 'プッシュ通知のON/OFF' },
  { iconName: 'location-outline', label: '位置情報設定', sub: '現在地の取得設定' },
  { iconName: 'lock-closed-outline', label: 'プライバシー', sub: '公開範囲の設定' },
];

/**
 * マイページ画面
 * ユーザープロフィール・活動統計・自分の投稿・設定を表示する
 */
export default function ProfileScreen() {
  const [postTab, setPostTab] = useState<PostTab>('active');
  const router = useRouter();
  const { session } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { posts: myPosts, loading: postsLoading } = useMyPosts();

  /** ログアウト処理 */
  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch {
      Alert.alert('エラー', 'ログアウトに失敗しました');
    }
  };

  /* 未ログイン時：ログイン誘導UI */
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>マイページ</Text>
        </View>
        <View style={styles.guestWrap}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.guestTitle}>ログインしていません</Text>
          <Text style={styles.guestSub}>ログインすると投稿の作成や{'\n'}活動履歴の確認ができます</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginBtnText}>ログイン</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>アカウントをお持ちでない方はこちら</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>プロフィールを取得できませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activePosts = myPosts.filter((p) => p.status === 'active');
  const endedPosts = myPosts.filter((p) => p.status === 'ended');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>マイページ</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ProfileCard
          displayName={profile.displayName}
          avatar={profile.avatar}
          verified={profile.verified}
          email={profile.email}
        />

        {/* 活動統計 */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bar-chart-outline" size={16} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>あなたの活動</Text>
          </View>
          <View style={styles.statsRow}>
            <StatBox label="投稿" value={profile.stats.posts} color="#059669" bg="#ECFDF5" />
            <StatBox label="協力" value={profile.stats.helped} color="#BE123C" bg="#FFF1F2" />
            <StatBox label="コメント" value={profile.stats.comments} color="#1D4ED8" bg="#EFF6FF" />
          </View>
        </View>

        <MyPostsCard
          activePosts={activePosts}
          endedPosts={endedPosts}
          postTab={postTab}
          onTabChange={setPostTab}
          onPostPress={(id) => router.push(`/post/${id}`)}
          loading={postsLoading}
        />

        {/* 設定メニュー */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="settings-outline" size={16} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>設定</Text>
          </View>
          {SETTING_ITEMS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Ionicons name={item.iconName} size={20} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingSubLabel}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** 統計数値ボックス */
function StatBox({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  settingsBtn: { padding: 4 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  settingSubLabel: { fontSize: 11, color: Colors.textSecondary },
  logoutButton: {
    marginTop: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  // ─── ゲスト用 ──────────────────────────────────────────
  guestWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  guestSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  loginBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  registerLink: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 4 },
});
