import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarFilterKey } from '@/features/events/types/olaylarScreenTypes';

type OlaylarFilterChipsProps = {
  active: OlaylarFilterKey;
  onChange: (key: OlaylarFilterKey) => void;
};

const FILTERS: { key: OlaylarFilterKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tümü', icon: 'grid-outline' },
  { key: 'critical', label: 'Kritik', icon: 'shield-outline' },
  { key: 'urgent', label: 'Acil', icon: 'notifications-outline' },
  { key: 'active', label: 'Aktif', icon: 'flash-outline' },
  { key: 'resolved', label: 'Çözüldü', icon: 'checkmark-circle-outline' },
];

export function OlaylarFilterChips({ active, onChange }: OlaylarFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {FILTERS.map((filter) => {
        const selected = active === filter.key;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.chipActive : styles.chipIdle,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}>
            <Ionicons
              name={filter.icon}
              size={14}
              color={selected ? '#FFFFFF' : olaylar.textMuted}
            />
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: olaylar.radiusChip,
  },
  chipIdle: {
    backgroundColor: olaylar.card,
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  chipActive: {
    backgroundColor: olaylar.green,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: olaylar.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.9,
  },
});
