/**
 * CreatePostHeader - 投稿作成画面のヘッダーバー
 * 閉じるボタン、タイトル、投稿ボタンを表示する
 */
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { postFormStyles as styles } from './PostFormStyles';

/** CreatePostHeader の Props */
type CreatePostHeaderProps = {
  /** 送信中フラグ（trueの場合ボタン無効化＋スピナー表示） */
  isSubmitting: boolean;
  /** 閉じるボタン押下時のコールバック */
  onClose: () => void;
  /** 投稿ボタン押下時のコールバック */
  onSubmit: () => void;
};

/**
 * 投稿作成画面のヘッダー
 * 左: 閉じるボタン / 中央: タイトル / 右: 投稿ボタン
 */
export default function CreatePostHeader({ isSubmitting, onClose, onSubmit }: CreatePostHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
        <Ionicons name="close" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>情報を投稿</Text>
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={onSubmit}
        activeOpacity={0.8}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.submitButtonText}>投稿</Text>}
      </TouchableOpacity>
    </View>
  );
}
