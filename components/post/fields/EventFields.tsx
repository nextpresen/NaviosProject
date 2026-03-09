/**
 * EventFields - イベントカテゴリの入力フィールド
 * 開催日・時間・参加費・定員を入力する
 */
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { PostFormData } from '../../../types';
import DatePickerField from '../../../components/common/DatePickerField';
import { postFormStyles as styles } from '../PostFormStyles';

/** EventFields の Props */
export type EventFieldsProps = {
  /** フォームデータ */
  form: PostFormData;
  /** フォーム更新コールバック */
  onUpdate: (patch: Partial<PostFormData>) => void;
};

/**
 * イベントカテゴリ固有の入力フィールド群
 * 日付・時間ピッカー、参加費、定員入力を提供する
 */
export default function EventFields({ form, onUpdate }: EventFieldsProps) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.row}>
        <View style={styles.flex1}>
          <DatePickerField
            label="開催日"
            value={form.eventDate ?? ''}
            placeholder="日付を選択"
            mode="date"
            onChange={(v) => onUpdate({ eventDate: v })}
          />
        </View>
        <View style={styles.flex1}>
          <DatePickerField
            label="開始時間"
            value={form.eventTime ?? ''}
            placeholder="時間を選択"
            mode="time"
            onChange={(v) => onUpdate({ eventTime: v })}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.subLabel}>参加費</Text>
          <TextInput
            style={styles.inputSm}
            value={form.fee}
            onChangeText={(v) => onUpdate({ fee: v })}
            placeholder="無料"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.subLabel}>定員</Text>
          <TextInput
            style={styles.inputSm}
            value={form.maxParticipants?.toString() ?? ''}
            onChangeText={(v) => onUpdate({ maxParticipants: v ? Number(v) : undefined })}
            placeholder="20"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
        </View>
      </View>
      <View style={[styles.infoNote, { backgroundColor: '#FFFBEB' }]}>
        <Ionicons name="calendar-outline" size={13} color="#92400E" />
        <Text style={[styles.infoNoteText, { color: '#92400E' }]}>
          開催日の23:59まで表示されます
        </Text>
      </View>
    </View>
  );
}
