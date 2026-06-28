import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarFilterKey } from '@/features/events/types/olaylarScreenTypes';

type OlaylarFilterChipsProps = {
  active: OlaylarFilterKey;
  onChange: (key: OlaylarFilterKey) => void;
  onSortPress?: () => void;
};

const FILTERS: { key: OlaylarFilterKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tümü', icon: 'grid-outline' },
  { key: 'critical', label: 'Kritik', icon: 'shield-outline' },
  { key: 'urgent', label: 'Acil', icon: 'notifications-outline' },
  { key: 'active', label: 'Aktif', icon: 'flash-outline' },
  { key: 'resolved', label: 'Çözüldü', icon: 'checkmark-circle-outline' },
];

export function OlaylarFilterChips({ active, onChange, onSortPress }: OlaylarFilterChipsProps) {
  return (
    <View style={styles.rowWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}>
        {FILTERS.map((filter) => {
          const selected = active === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => onChange(filter.key)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipActive : styles.chipIdle,
                selected && olaylar.glowTeal,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}>
              <Ionicons
                name={filter.icon}
                size={14}
                color={selected ? olaylar.teal : olaylar.textMuted}
              />
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onSortPress}
        style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Filtrele ve sırala">
        <Ionicons name="options-outline" size={18} color={olaylar.textSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scroll: {
    flex: 1,
  },
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
    paddingVertical: 9,
    borderRadius: olaylar.radiusChip,
    minHeight: 38,
  },
  chipIdle: {
    backgroundColor: olaylar.card,
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  chipActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
    borderWidth: 1,
    borderColor: olaylar.borderStrong,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: olaylar.textSoft,
  },
  chipTextActive: {
    color: olaylar.teal,
  },
  sortBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: olaylar.card,
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  pressed: {
    opacity: 0.9,
  },
});
