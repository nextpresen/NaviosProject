import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryInfo, getCategoryIconName } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import type { PostFormData } from '../../types';

type Props = {
  form: PostFormData;
  locationHint: string;
  showManualLocation: boolean;
  manualPlace: { name: string; address: string };
  onToggleManualLocation: (show: boolean) => void;
  onManualPlaceChange: (place: { name: string; address: string }) => void;
};

export default function CreateStepConfirm({
  form,
  locationHint,
  showManualLocation,
  manualPlace,
  onToggleManualLocation,
  onManualPlaceChange,
}: Props) {
  const category = getCategoryInfo(form.category);

  return (
    <>
      {/* Location */}
      <View style={styles.section}>
        <View style={styles.rowIcon}>
          <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.sectionLabel}>位置情報</Text>
        </View>
        <Text style={styles.locationText}>{locationHint}</Text>

        {/* Manual location fallback */}
        {!showManualLocation ? (
          <TouchableOpacity
            style={styles.manualLocationToggle}
            onPress={() => onToggleManualLocation(true)}
          >
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={styles.manualLocationToggleText}>手動で場所を入力</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.manualLocationFields}>
            <Text style={styles.manualLocationDivider}>または</Text>
            <TextInput
              style={styles.input}
              value={manualPlace.name}
              onChangeText={(v) => onManualPlaceChange({ ...manualPlace, name: v })}
              placeholder="場所の名前"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={manualPlace.address}
              onChangeText={(v) => onManualPlaceChange({ ...manualPlace, address: v })}
              placeholder="住所"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={styles.manualLocationClear}
              onPress={() => {
                onManualPlaceChange({ name: '', address: '' });
                onToggleManualLocation(false);
              }}
            >
              <Text style={styles.manualLocationClearText}>手動入力をクリア</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Summary card */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>投稿プレビュー</Text>
        <View style={styles.summaryCard}>
          {/* Category badge */}
          <View style={[styles.summaryBadge, { backgroundColor: category.color }]}>
            <Ionicons
              name={getCategoryIconName(form.category) as keyof typeof Ionicons.glyphMap}
              size={14}
              color="#fff"
            />
            <Text style={styles.summaryBadgeText}>{category.label}</Text>
          </View>

          {/* Title preview */}
          <Text style={styles.summaryTitle} numberOfLines={2}>
            {form.title || '(タイトル未入力)'}
          </Text>

          {/* Content preview */}
          {form.content ? (
            <Text style={styles.summaryContent} numberOfLines={2}>
              {form.content}
            </Text>
          ) : null}

          {/* Image count */}
          {form.images.length > 0 && (
            <View style={styles.summaryImageRow}>
              <Ionicons name="image-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.summaryMeta}>{form.images.length}枚の画像</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.summaryLocationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryMeta} numberOfLines={1}>{locationHint}</Text>
          </View>

          {/* Comments */}
          <View style={styles.summaryLocationRow}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryMeta}>
              コメント: {form.allowComments ? '許可' : '不許可'}
            </Text>
          </View>
        </View>
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  rowIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
  locationText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  manualLocationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  manualLocationToggleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  manualLocationFields: {
    gap: 10,
    marginTop: 4,
  },
  manualLocationDivider: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  manualLocationClear: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  manualLocationClearText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  summaryImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
