import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, getCategoryIconName } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import type { PostFormData } from '../../types';

type Props = {
  form: PostFormData;
  set: (patch: Partial<PostFormData>) => void;
  onPickImage: () => void;
  onRemoveImage: (uri: string) => void;
};

export default function CreateStepBasic({ form, set, onPickImage, onRemoveImage }: Props) {
  return (
    <>
      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>カテゴリ</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((item) => {
            const active = item.id === form.category;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryBtn,
                  active
                    ? { backgroundColor: item.color }
                    : { backgroundColor: item.bgColor, borderWidth: 1, borderColor: Colors.border },
                ]}
                onPress={() => set({ category: item.id })}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={getCategoryIconName(item.id) as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={active ? '#fff' : item.color}
                />
                <Text
                  style={[
                    styles.categoryBtnText,
                    active ? styles.categoryBtnTextActive : { color: item.color },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>タイトル <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => set({ title: v })}
          placeholder="例: 野菜が安いお店を見つけました"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Content */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>詳細</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.content}
          onChangeText={(v) => set({ content: v })}
          placeholder="内容を具体的に書いてください"
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.divider} />

      {/* Images */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>画像（最大4枚）</Text>
          <TouchableOpacity style={styles.imageAddBtn} onPress={onPickImage}>
            <Ionicons name="image-outline" size={16} color="#fff" />
            <Text style={styles.imageAddText}>追加</Text>
          </TouchableOpacity>
        </View>
        {form.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {form.images.map((uri) => (
              <View key={uri} style={styles.previewWrap}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.previewRemove} onPress={() => onRemoveImage(uri)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.danger,
    fontWeight: '400',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBtn: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryBtnTextActive: { color: '#fff' },
  input: {
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textarea: { minHeight: 100, paddingTop: 13 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  imageAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: Colors.primary,
  },
  imageAddText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  imageRow: {
    gap: 10,
    paddingVertical: 4,
  },
  previewWrap: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
