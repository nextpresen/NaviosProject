/**
 * プロフィール情報カード（アバター・名前・認証バッジ・メール）
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../common/UserAvatar';
import { Colors } from '../../constants/colors';

type Props = {
  /** 表示名 */
  displayName: string;
  /** アバター文字 */
  avatar: string;
  /** 認証済みかどうか */
  verified: boolean;
  /** メールアドレス */
  email: string;
};

/** プロフィールカード */
export default function ProfileCard({ displayName, avatar, verified, email }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <UserAvatar avatar={avatar} size={64} backgroundColor="#A7F3D0" />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            {verified && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={styles.badgeText}>認証済み</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editBtn}>
        <Ionicons name="pencil-outline" size={14} color={Colors.textPrimary} />
        <Text style={styles.editText}>プロフィールを編集</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  email: { fontSize: 13, color: Colors.textSecondary },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  editText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});
