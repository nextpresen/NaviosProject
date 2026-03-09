/**
 * AdminFields - 行政カテゴリの入力フィールド
 * 申請期限・必要書類を入力する
 */
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { PostFormData } from '../../../types';
import DatePickerField from '../../../components/common/DatePickerField';
import { postFormStyles as styles } from '../PostFormStyles';

/** AdminFields の Props */
export type AdminFieldsProps = {
  /** フォームデータ */
  form: PostFormData;
  /** フォーム更新コールバック */
  onUpdate: (patch: Partial<PostFormData>) => void;
};

/**
 * 行政カテゴリ固有の入力フィールド群
 * 申請期限ピッカーと必要書類テキスト入力を提供する
 */
export default function AdminFields({ form, onUpdate }: AdminFieldsProps) {
  return (
    <View style={styles.fieldGroup}>
      <DatePickerField
        label="申請期限"
        value={form.deadline ?? ''}
        placeholder="期限を選択"
        mode="date"
        onChange={(v) => onUpdate({ deadline: v })}
      />
      <View>
        <Text style={styles.subLabel}>必要書類（改行区切り）</Text>
        <TextInput
          style={[styles.inputSm, styles.textarea]}
          value={Array.isArray(form.requirements) ? form.requirements.join('\n') : ''}
          onChangeText={(v) => onUpdate({ requirements: v.split('\n') })}
          placeholder={'届いたハガキ\n本人確認書類\n振込口座がわかるもの'}
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
      <View style={[styles.infoNote, { backgroundColor: '#F5F3FF' }]}>
        <Ionicons name="document-text-outline" size={13} color="#4C1D95" />
        <Text style={[styles.infoNoteText, { color: '#4C1D95' }]}>
          申請期限まで表示されます
        </Text>
      </View>
    </View>
  );
}
