/**
 * RootLayout - アプリ全体のルートレイアウト
 * Expo Router の Stack ナビゲーターを使用
 * Tabs グループ / 投稿詳細 / 投稿作成 / 認証画面を管理する
 * セッション状態に応じてログイン画面 / メイン画面へリダイレクト
 */
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';

/**
 * 認証ガード
 * ログイン済みユーザーが auth 画面にいる場合のみ /(tabs) へリダイレクト
 * 未ログインでもタブ画面（閲覧）は許可する
 * 投稿作成など認証必須の画面は各画面側でガードする
 */
function AuthGuard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  return null;
}

/**
 * ルートレイアウト
 * SafeAreaProvider を最上位に配置し、Stack で画面を管理する
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGuard />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="post/create" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
