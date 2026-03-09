/**
 * HelpFields - 近助カテゴリの入力フィールド
 * タイプ（お願い/お裾分け）・お礼・所要時間を入力する
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { PostFormData } from '../../../types';
import { postFormStyles as styles } from '../PostFormStyles';

/** HelpFields の Props */
export type HelpFieldsProps = {
  /** フォームデータ */
  form: PostFormData;
  /** フォーム更新コールバック */
  onUpdate: (patch: Partial<PostFormData>) => void;
};

/**
 * 近助カテゴリ固有の入力フィールド群
 * リクエスト/シェア切替、お礼・お裾分け品入力、所要時間入力を提供する
 */
export default function HelpFields({ form, onUpdate }: HelpFieldsProps) {
  return (
    <View style={styles.fieldGroup}>
      <View>
        <Text style={styles.subLabel}>タイプ</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.typeButton, form.helpType === 'request' && { backgroundColor: '#F43F5E' }]}
            onPress={() => onUpdate({ helpType: 'request' })}
          >
            <Ionicons name="hand-left-outline" size={14} color={form.helpType === 'request' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeButtonText, form.helpType === 'request' && styles.typeButtonTextActive]}>お願い</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, form.helpType === 'share' && { backgroundColor: '#F43F5E' }]}
            onPress={() => onUpdate({ helpType: 'share' })}
          >
            <Ionicons name="gift-outline" size={14} color={form.helpType === 'share' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeButtonText, form.helpType === 'share' && styles.typeButtonTextActive]}>お裾分け</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View>
        <Text style={styles.subLabel}>{form.helpType === 'request' ? 'お礼' : 'お裾分け品'}</Text>
        <TextInput
          style={styles.inputSm}
          value={form.reward}
          onChangeText={(v) => onUpdate({ reward: v })}
          placeholder={form.helpType === 'request' ? '自家製野菜' : '大根2本'}
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      {form.helpType === 'request' && (
        <View>
          <Text style={styles.subLabel}>所要時間の目安</Text>
          <TextInput
            style={styles.inputSm}
            value={form.estimatedTime}
            onChangeText={(v) => onUpdate({ estimatedTime: v })}
            placeholder="30分〜1時間"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      )}
      <View style={[styles.infoNote, { backgroundColor: '#FFF1F2' }]}>
        <Ionicons name="timer-outline" size={13} color="#9F1239" />
        <Text style={[styles.infoNoteText, { color: '#9F1239' }]}>
          48時間後に自動で非表示になります（手動で終了も可）
        </Text>
      </View>
    </View>
  );
}
