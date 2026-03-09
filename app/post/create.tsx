/**
 * CreatePostScreen - 投稿作成画面
 * mock.jsx: view === 'post' の画面
 * カテゴリ別フォームフィールドを持つ投稿作成UI
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES, CategoryId, getCategoryIconName } from '../../constants/categories';
import { PostFormData } from '../../types';
import { Colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { createPost } from '../../lib/postsApi';
import { supabase } from '../../lib/supabase';
import CreatePostHeader from '../../components/post/CreatePostHeader';
import CategoryFields from '../../components/post/CategoryFields';
import { postFormStyles as styles } from '../../components/post/PostFormStyles';

const CATEGORY_TIPS: Record<CategoryId, string[]> = {
  stock: ['数量制限があれば明記しましょう', '価格は税込みで記載すると親切です', '在庫状況をこまめに更新しましょう'],
  event: ['集合場所を具体的に書きましょう', '持ち物があれば記載しましょう', '雨天時の対応も書くと親切です'],
  help: ['具体的な作業内容を書きましょう', 'お礼の内容を明記すると◎', '所要時間の目安があると助かります'],
  admin: ['申請期限を必ず記載しましょう', '必要書類を箇条書きで', '問い合わせ先も記載しましょう'],
};

const INITIAL_FORM: PostFormData = {
  category: 'stock',
  title: '',
  content: '',
  images: [],
  allowComments: true,
  price: '',
  stockStatus: '在庫あり',
  stockDuration: '48hours',
  eventDate: '',
  eventTime: '',
  fee: '',
  maxParticipants: undefined,
  helpType: 'request',
  reward: '',
  estimatedTime: '',
  deadline: '',
  requirements: [],
};

/**
 * 投稿作成画面
 * カテゴリ選択・写真添付・カテゴリ別詳細入力・場所設定を行い Supabase に保存する
 */
export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<PostFormData>(INITIAL_FORM);
  const { coords, loading: locationLoading, error: locationError } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (patch: Partial<PostFormData>) => setForm((prev) => ({ ...prev, ...patch }));

  /** カメラで撮影した画像をフォームに追加する */
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      set({ images: [...form.images, result.assets[0].uri] });
    }
  };

  /** ライブラリから画像を選択してフォームに追加する */
  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'フォトライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 4,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      set({ images: [...form.images, ...uris].slice(0, 4) });
    }
  };

  /** 現在地を取得してフォームの場所にセットする */
  const handleUseCurrentLocation = () => {
    if (locationError) { Alert.alert('位置情報エラー', locationError); return; }
    if (!coords) { Alert.alert('位置情報', '現在地を取得中です。しばらくお待ちください。'); return; }
    set({ place: { name: '現在地', address: '', latitude: coords.latitude, longitude: coords.longitude } });
  };

  /** 投稿を Supabase DB に保存する */
  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert('入力エラー', 'タイトルを入力してください'); return; }
    if (!form.place && !coords) { Alert.alert('位置情報エラー', '場所を設定するか、位置情報を許可してください'); return; }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('エラー', 'ログインが必要です'); return; }
      const formWithPlace = form.place
        ? form
        : { ...form, place: { name: '現在地付近', address: '', latitude: coords!.latitude, longitude: coords!.longitude } };
      await createPost(formWithPlace, user.id);
      Alert.alert('投稿しました！', '', [
        { text: 'OK', onPress: () => { setForm(INITIAL_FORM); router.back(); } },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message
        : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message)
        : JSON.stringify(e);
      Alert.alert('投稿に失敗しました', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = CATEGORY_TIPS[form.category];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <CreatePostHeader isSubmitting={isSubmitting} onClose={() => router.back()} onSubmit={handleSubmit} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* カテゴリ選択 */}
        <View style={styles.section}>
          <Text style={styles.label}>カテゴリ</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const isActive = form.category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryButton, isActive ? { backgroundColor: c.color } : styles.categoryButtonInactive]}
                  onPress={() => set({ category: c.id })}
                  activeOpacity={0.8}
                >
                  <Ionicons name={getCategoryIconName(c.id) as keyof typeof Ionicons.glyphMap} size={16} color={isActive ? '#fff' : Colors.textSecondary} />
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 写真 */}
        <View style={styles.section}>
          <Text style={styles.label}>写真（任意・最大4枚）</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoButton} activeOpacity={0.7} onPress={handleCamera}>
              <Ionicons name="camera-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.photoLabel}>撮影</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} activeOpacity={0.7} onPress={handleGallery}>
              <Ionicons name="images-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.photoLabel}>選択</Text>
            </TouchableOpacity>
          </View>
          {form.images.length > 0 && (
            <View style={styles.imagePreviewRow}>
              {form.images.map((uri, i) => (
                <View key={i} style={styles.imagePreviewWrap}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.imageRemoveButton} onPress={() => set({ images: form.images.filter((_, idx) => idx !== i) })}>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* タイトル */}
        <View style={styles.section}>
          <Text style={styles.label}>タイトル <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} value={form.title} onChangeText={(v) => set({ title: v })} placeholder="例: 卵入荷しました" placeholderTextColor={Colors.textMuted} />
        </View>

        {/* 詳細 */}
        <View style={styles.section}>
          <Text style={styles.label}>詳細（任意）</Text>
          <TextInput style={[styles.input, styles.textarea]} value={form.content} onChangeText={(v) => set({ content: v })} placeholder="詳しい情報を入力..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* カテゴリ別フィールド */}
        <CategoryFields form={form} onUpdate={set} />

        {/* 場所 */}
        <View style={styles.categoryDetailBox}>
          <View style={styles.categoryDetailHeader}>
            <Ionicons name="location-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.categoryDetailTitle}>場所</Text>
          </View>
          <TouchableOpacity style={styles.locationButton} activeOpacity={0.7} onPress={handleUseCurrentLocation} disabled={locationLoading}>
            <View style={styles.locationLeft}>
              {locationLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name={form.place ? 'location-sharp' : 'locate-outline'} size={16} color={Colors.primary} />}
              <Text style={styles.locationText}>{locationLoading ? '取得中...' : form.place ? form.place.name : '現在地を使用'}</Text>
            </View>
            {form.place ? (
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => set({ place: undefined })}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.locationHint}>{locationError ? '権限なし' : '伊集院町付近'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* コメント設定 */}
        <View style={styles.categoryDetailBox}>
          <View style={styles.commentRow}>
            <View style={styles.commentLeft}>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.categoryDetailTitle}>コメントを受け付ける</Text>
            </View>
            <Switch value={form.allowComments} onValueChange={(v) => set({ allowComments: v })} trackColor={{ false: Colors.border, true: '#10B981' }} thumbColor="#fff" />
          </View>
        </View>

        {/* 投稿のコツ */}
        <View style={styles.tipsBox}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={16} color="#92400E" />
            <Text style={styles.tipsTitle}>投稿のコツ</Text>
          </View>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-outline" size={13} color="#92400E" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
