/**
 * DatePickerField - 日付/時刻入力フィールド
 * タップするとネイティブの DateTimePicker を表示する
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type Props = {
  /** 表示ラベル */
  label: string;
  /** 選択済みの値（表示用テキスト） */
  value: string;
  /** placeholder テキスト */
  placeholder: string;
  /** 'date' | 'time' */
  mode: 'date' | 'time';
  /** 値変更コールバック（フォーマット済みの文字列を返す） */
  onChange: (formatted: string) => void;
};

/**
 * 日付または時刻をピッカーで選択するフィールド
 */
export default function DatePickerField({ label, value, placeholder, mode, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  /** ピッカーの値変更ハンドラ */
  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (!selected) return;
    setTempDate(selected);

    if (mode === 'date') {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    } else {
      const h = String(selected.getHours()).padStart(2, '0');
      const min = String(selected.getMinutes()).padStart(2, '0');
      onChange(`${h}:${min}`);
    }

    if (Platform.OS === 'ios') {
      setShow(false);
    }
  };

  const iconName = mode === 'date' ? 'calendar-outline' : 'time-outline';

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={16} color={value ? Colors.textPrimary : Colors.textMuted} />
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={mode === 'date' ? new Date() : undefined}
          locale="ja"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: { fontSize: 13, color: Colors.textPrimary },
  placeholder: { color: Colors.textMuted },
});
