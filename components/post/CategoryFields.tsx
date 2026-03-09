/**
 * CategoryFields - カテゴリ別フォームフィールド
 * 物資・イベント・近助・行政それぞれの入力項目を切り替え表示する
 */
import React from 'react';
import { View, Text } from 'react-native';
import { getCategoryInfo } from '../../constants/categories';
import { PostFormData } from '../../types';
import { postFormStyles as styles } from './PostFormStyles';
import StockFields from './fields/StockFields';
import EventFields from './fields/EventFields';
import HelpFields from './fields/HelpFields';
import AdminFields from './fields/AdminFields';

/** CategoryFields の Props */
type CategoryFieldsProps = {
  /** 現在のフォームデータ */
  form: PostFormData;
  /** フォームの部分更新コールバック */
  onUpdate: (patch: Partial<PostFormData>) => void;
};

/**
 * カテゴリ別の詳細入力フィールド群
 * カテゴリヘッダー + カテゴリ固有の入力欄を描画する
 */
export default function CategoryFields({ form, onUpdate }: CategoryFieldsProps) {
  const cat = getCategoryInfo(form.category);

  return (
    <View style={styles.categoryDetailBox}>
      <View style={styles.categoryDetailHeader}>
        <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
        <Text style={styles.categoryDetailTitle}>{cat.label}情報</Text>
      </View>

      {form.category === 'stock' && (
        <StockFields form={form} onUpdate={onUpdate} catColor={cat.color} />
      )}
      {form.category === 'event' && (
        <EventFields form={form} onUpdate={onUpdate} />
      )}
      {form.category === 'help' && (
        <HelpFields form={form} onUpdate={onUpdate} />
      )}
      {form.category === 'admin' && (
        <AdminFields form={form} onUpdate={onUpdate} />
      )}
    </View>
  );
}
