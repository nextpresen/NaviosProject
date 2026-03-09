/**
 * StockFields - 物資カテゴリの入力フィールド
 * 価格・在庫状況・表示期間を入力する
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/colors';
import { PostFormData } from '../../../types';
import { postFormStyles as styles } from '../PostFormStyles';

const STOCK_DURATION_OPTIONS = [
  { value: 'today', label: '今日中' },
  { value: '48hours', label: '明日まで' },
  { value: '3days', label: '3日間' },
  { value: '1week', label: '1週間' },
  { value: 'manual', label: '手動で終了' },
] as const;

/** StockFields の Props */
export type StockFieldsProps = {
  /** フォームデータ */
  form: PostFormData;
  /** フォーム更新コールバック */
  onUpdate: (patch: Partial<PostFormData>) => void;
  /** カテゴリカラー */
  catColor: string;
};

/**
 * 物資カテゴリ固有の入力フィールド群
 * 価格入力・在庫ステータス選択・表示期間選択を提供する
 */
export default function StockFields({ form, onUpdate, catColor }: StockFieldsProps) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.subLabel}>価格</Text>
          <TextInput
            style={styles.inputSm}
            value={form.price}
            onChangeText={(v) => onUpdate({ price: v })}
            placeholder="¥280"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.subLabel}>在庫状況</Text>
          <View style={styles.selectRow}>
            {(['在庫あり', '残りわずか', '入荷予定'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.selectOption, form.stockStatus === s && { backgroundColor: catColor }]}
                onPress={() => onUpdate({ stockStatus: s })}
              >
                <Text style={[styles.selectOptionText, form.stockStatus === s && styles.selectOptionTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.subLabel}>表示期間</Text>
        <View style={styles.durationRow}>
          {STOCK_DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.durationButton, form.stockDuration === opt.value && { backgroundColor: '#10B981' }]}
              onPress={() => onUpdate({ stockDuration: opt.value })}
            >
              <Text style={[styles.durationButtonText, form.stockDuration === opt.value && styles.durationButtonTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
