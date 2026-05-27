import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EventScreenFilterKey,
  getEventScreenFilters,
} from '@/features/events/utils/eventsScreenModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type EventFilterChipsProps = {
  active: EventScreenFilterKey;
  onChange: (key: EventScreenFilterKey) => void;
};

export function EventFilterChips({ active, onChange }: EventFilterChipsProps) {
  const filters = getEventScreenFilters();

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}>
        {filters.map((f) => {
          const selected = active === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => onChange(f.key)}
              style={({ pressed }) => [
                styles.chip,
                !selected && shadows.soft,
                selected && styles.chipActive,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[styles.chipText, selected && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        style={[styles.sortBtn, shadows.soft]}
        accessibilityLabel="Sıralama"
        onPress={() => {
          // TODO: sıralama / gelişmiş filtre modalı
        }}>
        <Ionicons
          name="options-outline"
          size={17}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  sortBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
