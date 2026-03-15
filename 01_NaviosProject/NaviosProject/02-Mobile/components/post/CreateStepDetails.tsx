import React from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryInfo } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import type { PostFormData } from '../../types';

const STOCK_DURATION_OPTIONS = [
  { value: 'today', label: '本日中' },
  { value: '48hours', label: '48時間' },
  { value: '3days', label: '3日間' },
  { value: '1week', label: '1週間' },
  { value: 'manual', label: '手動設定' },
] as const;

type Props = {
  form: PostFormData;
  set: (patch: Partial<PostFormData>) => void;
  onOpenCalendar: (target: 'eventDate' | 'deadline') => void;
  onOpenTimePicker: () => void;
};

export default function CreateStepDetails({ form, set, onOpenCalendar, onOpenTimePicker }: Props) {
  const category = getCategoryInfo(form.category);

  return (
    <>
      {/* Category-specific fields */}
      <View style={styles.sectionGrouped}>
        <Text style={styles.sectionLabel}>{category.label}の詳細</Text>

        {form.category === 'stock' ? (
          <View style={styles.fieldsGap}>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(v) => set({ price: v })}
              placeholder="価格（例: 100円 / 1袋）"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.wrapRow}>
              {STOCK_DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, form.stockDuration === opt.value && styles.chipActive]}
                  onPress={() => set({ stockDuration: opt.value })}
                >
                  <Text style={[styles.chipText, form.stockDuration === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {form.category === 'event' ? (
          <View style={styles.fieldsGap}>
            <TouchableOpacity style={styles.inputLike} onPress={() => onOpenCalendar('eventDate')}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              <Text style={[styles.inputLikeText, !form.eventDate && styles.inputLikePlaceholder]}>
                {form.eventDate || '開催日を選択'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputLike} onPress={onOpenTimePicker}>
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              <Text style={[styles.inputLikeText, !form.eventTime && styles.inputLikePlaceholder]}>
                {form.eventTime || '開催時刻を選択'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={form.fee}
              onChangeText={(v) => set({ fee: v })}
              placeholder="参加費（例: 無料 / 500円）"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={form.maxParticipants ? String(form.maxParticipants) : ''}
              onChangeText={(v) => set({ maxParticipants: v ? Number(v) : undefined })}
              placeholder="最大参加人数"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        ) : null}

        {form.category === 'help' ? (
          <View style={styles.fieldsGap}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.halfBtn, form.helpType === 'request' && styles.halfBtnActive]}
                onPress={() => set({ helpType: 'request' })}
              >
                <Ionicons
                  name="hand-right-outline"
                  size={16}
                  color={form.helpType === 'request' ? '#fff' : Colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.halfBtnText, form.helpType === 'request' && styles.halfBtnTextActive]}>
                  お願い
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.halfBtn, form.helpType === 'share' && styles.halfBtnActive]}
                onPress={() => set({ helpType: 'share' })}
              >
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={form.helpType === 'share' ? '#fff' : Colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.halfBtnText, form.helpType === 'share' && styles.halfBtnTextActive]}>
                  提供
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={form.reward}
              onChangeText={(v) => set({ reward: v })}
              placeholder="お礼・提供内容"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={form.estimatedTime}
              onChangeText={(v) => set({ estimatedTime: v })}
              placeholder="所要時間の目安"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        ) : null}

        {form.category === 'admin' ? (
          <View style={styles.fieldsGap}>
            <TouchableOpacity style={styles.inputLike} onPress={() => onOpenCalendar('deadline')}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              <Text style={[styles.inputLikeText, !form.deadline && styles.inputLikePlaceholder]}>
                {form.deadline || '締切日を選択'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={Array.isArray(form.requirements) ? form.requirements.join('\n') : ''}
              onChangeText={(v) => set({ requirements: v.split('\n').map((item) => item.trim()).filter(Boolean) })}
              placeholder="必要なもの（1行に1つ）"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      {/* Comments toggle */}
      <View style={styles.sectionRow}>
        <View style={styles.rowIcon}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.sectionLabel}>コメントを許可</Text>
        </View>
        <Switch
          value={form.allowComments}
          onValueChange={(v) => set({ allowComments: v })}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionGrouped: {
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  textarea: { minHeight: 100, paddingTop: 13 },
  inputLike: {
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputLikeText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputLikePlaceholder: {
    color: Colors.textMuted,
  },
  fieldsGap: {
    gap: 10,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  halfBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  halfBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  halfBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  halfBtnTextActive: { color: '#fff' },
});
